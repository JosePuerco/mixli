// Schreibzugriffe auf die Datenbank. Alles, was mehrere Tabellen betrifft, läuft in einer Transaktion,
// damit nie ein halber Zustand (z. B. Zutat ohne ihr Foto) gespeichert wird.
import { db } from './db'
import type { Category, Ingredient, Mix, MixItem } from './types'
import { mergeTags, normalizeDraft, sameName, type IngredientDraft } from '../domain/ingredient'
import { snapshotOf } from '../domain/mix'
import { draftFromMix, emptyDraft, normalizeDraftText, parseDraft, templateFromMix, type MixDraft } from '../domain/mixDraft'
import { MIX_DRAFT_KEY, OLD_FILTER_KEYS } from '../backup/format'
import { newId } from '../lib/id'
import { blobToPhotoData } from './photo'

/** Was mit dem Foto passieren soll: behalten, ersetzen oder entfernen. */
export type PhotoChange = { kind: 'keep' } | { kind: 'set'; blob: Blob } | { kind: 'remove' }

/**
 * Legt eine Zutat an (ohne id) oder speichert Änderungen (mit id). Gibt die id zurück.
 * Ein ersetztes oder entferntes Foto wird mitgelöscht.
 */
export async function saveIngredient(draft: IngredientDraft, photo: PhotoChange, id?: string): Promise<string> {
  const data = normalizeDraft(draft)
  if (!data.name) throw new Error('Name fehlt')
  // Vor der Transaktion umwandeln: Wartet eine Transaktion auf etwas anderes als die Datenbank,
  // schließt IndexedDB sie vorzeitig.
  const photoData = photo.kind === 'set' ? await blobToPhotoData(photo.blob) : undefined

  return db.transaction('rw', db.ingredients, db.photos, async () => {
    const now = new Date()
    const existing = id ? await db.ingredients.get(id) : undefined
    if (id && !existing) throw new Error('Zutat nicht gefunden')

    let photoId = existing?.photoId
    if (photo.kind !== 'keep') {
      if (photoId) await db.photos.delete(photoId)
      photoId = undefined
    }
    if (photoData) {
      photoId = newId()
      await db.photos.add({ id: photoId, ...photoData, createdAt: now })
    }

    const ingredient: Ingredient = {
      ...data,
      id: existing?.id ?? newId(),
      photoId,
      archived: existing?.archived ?? false,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }
    await db.ingredients.put(ingredient)
    return ingredient.id
  })
}

/** Archivieren statt Löschen: gespeicherte Müslis behalten so ihre Zutat. */
export async function setArchived(id: string, archived: boolean): Promise<void> {
  await db.ingredients.update(id, { archived, updatedAt: new Date() })
}

/**
 * Alle wählbaren Tags: Standard-Tags und alle eigenen Tags aus gespeicherten Zutaten.
 * Bewusst über toArray() statt orderBy('tags').uniqueKeys(): uniqueKeys öffnet immer einen Cursor
 * (openKeyCursor, „nextunique“), und genau das scheitert in Safari 18 (iOS 18.7) mit
 * „UnknownError: Unable to open cursor“. toArray() nutzt getAll und läuft dort zuverlässig.
 */
export async function listTags(): Promise<string[]> {
  const ingredients = await db.ingredients.toArray()
  return mergeTags(ingredients.flatMap((i) => i.tags))
}

/** Kategorien in der eingestellten Reihenfolge. */
export async function listCategories(): Promise<Category[]> {
  return db.categories.orderBy('order').toArray()
}

/**
 * Legt eine Kategorie am Ende an. Gibt es schon eine mit gleichem Namen
 * (ohne Groß-/Kleinschreibung), wird deren id zurückgegeben statt eine doppelte anzulegen.
 */
export async function addCategory(name: string): Promise<string> {
  const clean = name.trim().replace(/\s+/g, ' ')
  if (!clean) throw new Error('Name fehlt')
  return db.transaction('rw', db.categories, async () => {
    const all = await db.categories.toArray()
    const same = all.find((c) => sameName(c.name, clean))
    if (same) return same.id
    const order = all.reduce((max, c) => Math.max(max, c.order), -1) + 1
    const id = newId()
    await db.categories.add({ id, name: clean, order })
    return id
  })
}

/** Benennt eine Kategorie um. Gibt false zurück, wenn der Name leer oder schon vergeben ist. */
export async function renameCategory(id: string, name: string): Promise<boolean> {
  const clean = name.trim().replace(/\s+/g, ' ')
  if (!clean) return false
  return db.transaction('rw', db.categories, async () => {
    const all = await db.categories.toArray()
    if (all.some((c) => c.id !== id && sameName(c.name, clean))) return false
    await db.categories.update(id, { name: clean })
    return true
  })
}

/** Löscht eine Kategorie. Betroffene Zutaten stehen danach „ohne Kategorie“ da. */
export async function deleteCategory(id: string): Promise<void> {
  await db.transaction('rw', db.categories, db.ingredients, async () => {
    await db.categories.delete(id)
    await db.ingredients
      .where('categoryId')
      .equals(id)
      .modify((i) => {
        delete i.categoryId
      })
  })
}

/** Speichert eine neue Reihenfolge (ids von oben nach unten). */
export async function reorderCategories(ids: readonly string[]): Promise<void> {
  await db.categories.bulkUpdate(ids.map((id, order) => ({ key: id, changes: { order } })))
}

// ---------- Müslis ----------

/** Der Mix in Arbeit. Ohne gespeicherten Entwurf (oder bei unlesbarem) ein leerer. */
export async function loadDraft(): Promise<MixDraft> {
  const row = await db.settings.get(MIX_DRAFT_KEY)
  return row ? parseDraft(row.value) : emptyDraft()
}

/** Speichert den Mix in Arbeit (nach jeder Änderung im Mixen-Screen). */
export async function saveDraft(draft: MixDraft): Promise<void> {
  await db.settings.put({ key: MIX_DRAFT_KEY, value: draft })
}

export async function clearDraft(): Promise<void> {
  await db.settings.delete(MIX_DRAFT_KEY)
}

/** Löscht Filter, die eine frühere Version dauerhaft gespeichert hat (Filter gelten nur bis zum Neustart). */
export async function removeOldFilters(): Promise<void> {
  await db.settings.bulkDelete([...OLD_FILTER_KEYS])
}

/**
 * Speichert den Entwurf als Müsli und leert danach den Entwurf. Gibt die id zurück.
 * Mit mixId wird dieses Müsli überschrieben (Datum bleibt), sonst ein neues angelegt.
 * Zeilen ohne eigenen Snapshot bekommen hier die aktuellen Werte ihrer Zutat.
 */
export async function saveMix(draft: MixDraft): Promise<string> {
  const data = normalizeDraftText(draft)
  if (!data.name) throw new Error('Name fehlt')

  return db.transaction('rw', db.mixes, db.ingredients, db.settings, async () => {
    const existing = data.mixId ? await db.mixes.get(data.mixId) : undefined
    if (data.mixId && !existing) throw new Error('Müsli nicht gefunden')

    const ingredients = await db.ingredients.bulkGet(data.items.map((i) => i.ingredientId))
    const items: MixItem[] = []
    data.items.forEach((item, idx) => {
      if (item.grams <= 0) return
      const current = ingredients[idx]
      const snapshot = item.snapshot ?? (current && snapshotOf(current))
      if (!snapshot) throw new Error('Zutat nicht gefunden')
      items.push({ ingredientId: item.ingredientId, grams: item.grams, snapshot })
    })
    if (items.length === 0) throw new Error('Keine Zutaten')

    const now = new Date()
    const mix: Mix = {
      id: existing?.id ?? newId(),
      name: data.name,
      ...(data.forWhom && { forWhom: data.forWhom }),
      items,
      ...(data.note && { note: data.note }),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }
    await db.mixes.put(mix)
    await db.settings.delete(MIX_DRAFT_KEY)
    return mix.id
  })
}

export async function deleteMix(id: string): Promise<void> {
  await db.mixes.delete(id)
}

/** „Bearbeiten“: legt das Müsli mit seinen Snapshots als Entwurf in den Mixen-Screen. */
export async function editMix(id: string): Promise<MixDraft> {
  return db.transaction('rw', db.mixes, db.settings, async () => {
    const mix = await db.mixes.get(id)
    if (!mix) throw new Error('Müsli nicht gefunden')
    const draft = draftFromMix(mix)
    await db.settings.put({ key: MIX_DRAFT_KEY, value: draft })
    return draft
  })
}

/** „Duplizieren als Vorlage“: legt Zutaten und Mengen als neuen Entwurf mit aktuellen Werten an. */
export async function duplicateMix(id: string): Promise<MixDraft> {
  return db.transaction('rw', db.mixes, db.ingredients, db.settings, async () => {
    const mix = await db.mixes.get(id)
    if (!mix) throw new Error('Müsli nicht gefunden')
    const found = await db.ingredients.bulkGet(mix.items.map((i) => i.ingredientId))
    const existing = new Set(found.flatMap((i) => (i ? [i.id] : [])))
    const draft = templateFromMix(mix, existing)
    await db.settings.put({ key: MIX_DRAFT_KEY, value: draft })
    return draft
  })
}

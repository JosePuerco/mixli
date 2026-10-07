// Schreibzugriffe auf die Datenbank. Alles, was mehrere Tabellen betrifft, läuft in einer Transaktion,
// damit nie ein halber Zustand (z. B. Zutat ohne ihr Foto) gespeichert wird.
import { db } from './db'
import type { Category, Ingredient } from './types'
import { mergeTags, normalizeDraft, sameName, type IngredientDraft } from '../domain/ingredient'
import { newId } from '../lib/id'

/** Was mit dem Foto passieren soll: behalten, ersetzen oder entfernen. */
export type PhotoChange = { kind: 'keep' } | { kind: 'set'; blob: Blob } | { kind: 'remove' }

/**
 * Legt eine Zutat an (ohne id) oder speichert Änderungen (mit id). Gibt die id zurück.
 * Ein ersetztes oder entferntes Foto wird mitgelöscht.
 */
export async function saveIngredient(draft: IngredientDraft, photo: PhotoChange, id?: string): Promise<string> {
  const data = normalizeDraft(draft)
  if (!data.name) throw new Error('Name fehlt')

  return db.transaction('rw', db.ingredients, db.photos, async () => {
    const now = new Date()
    const existing = id ? await db.ingredients.get(id) : undefined
    if (id && !existing) throw new Error('Zutat nicht gefunden')

    let photoId = existing?.photoId
    if (photo.kind !== 'keep') {
      if (photoId) await db.photos.delete(photoId)
      photoId = undefined
    }
    if (photo.kind === 'set') {
      photoId = newId()
      await db.photos.add({ id: photoId, blob: photo.blob, createdAt: now })
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

/** Alle wählbaren Tags: Standard-Tags und alle eigenen Tags aus gespeicherten Zutaten. */
export async function listTags(): Promise<string[]> {
  const stored = (await db.ingredients.orderBy('tags').uniqueKeys()) as string[]
  return mergeTags(stored)
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

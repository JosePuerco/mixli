// Muss als Erstes geladen werden: stellt eine IndexedDB im Speicher bereit (Node hat keine).
import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from './db'
import {
  addCategory,
  clearDraft,
  deleteCategory,
  deleteMix,
  duplicateMix,
  editMix,
  listCategories,
  listTags,
  loadDraft,
  renameCategory,
  reorderCategories,
  saveDraft,
  saveIngredient,
  saveMix,
  setArchived,
} from './repo'
import type { IngredientDraft } from '../domain/ingredient'
import { addItem, emptyDraft, type MixDraft } from '../domain/mixDraft'

const draft = (overrides: Partial<IngredientDraft> = {}): IngredientDraft => ({
  name: 'Haferflocken',
  nutrition: { kcal: 372, kj: 1574, fat: 7, saturatedFat: 1.3, carbs: 58.7, sugar: 0.7, fiber: 10, protein: 13.5, salt: 0.01 },
  allergensContains: ['gluten'],
  allergensTraces: [],
  tags: [],
  ...overrides,
})

const blob = (text: string) => new Blob([text], { type: 'image/webp' })

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('saveIngredient', () => {
  it('legt eine Zutat an und räumt die Eingaben auf', async () => {
    const id = await saveIngredient(draft({ name: '  Haferflocken ', brand: ' ' }), { kind: 'keep' })
    const saved = await db.ingredients.get(id)
    expect(saved?.name).toBe('Haferflocken')
    expect(saved?.brand).toBeUndefined()
    expect(saved?.archived).toBe(false)
    expect(saved?.createdAt).toBeInstanceOf(Date)
  })

  it('speichert ein Foto getrennt als Bytes mit Bildtyp und verknüpft es', async () => {
    const id = await saveIngredient(draft(), { kind: 'set', blob: blob('abc') })
    const saved = await db.ingredients.get(id)
    expect(saved?.photoId).toBeDefined()
    expect(await db.photos.count()).toBe(1)

    const photo = await db.photos.get(saved!.photoId!)
    expect(photo?.blob).toBeUndefined()
    expect(photo?.type).toBe('image/webp')
    expect(new TextDecoder().decode(photo?.data)).toBe('abc')
  })

  it('löscht das alte Foto beim Ersetzen und Entfernen', async () => {
    const id = await saveIngredient(draft(), { kind: 'set', blob: blob('a') })
    const first = (await db.ingredients.get(id))?.photoId

    await saveIngredient(draft(), { kind: 'set', blob: blob('b') }, id)
    const second = (await db.ingredients.get(id))?.photoId
    expect(second).not.toBe(first)
    expect(await db.photos.get(first!)).toBeUndefined()
    expect(await db.photos.count()).toBe(1)

    await saveIngredient(draft(), { kind: 'remove' }, id)
    expect((await db.ingredients.get(id))?.photoId).toBeUndefined()
    expect(await db.photos.count()).toBe(0)
  })

  it('behält beim Bearbeiten Foto, Archiv-Status und Anlagedatum', async () => {
    const id = await saveIngredient(draft(), { kind: 'set', blob: blob('a') })
    await setArchived(id, true)
    const before = await db.ingredients.get(id)

    await saveIngredient(draft({ name: 'Dinkelflocken' }), { kind: 'keep' }, id)
    const after = await db.ingredients.get(id)
    expect(after?.name).toBe('Dinkelflocken')
    expect(after?.photoId).toBe(before?.photoId)
    expect(after?.archived).toBe(true)
    expect(after?.createdAt).toEqual(before?.createdAt)
  })

  it('lehnt einen leeren Namen ab', async () => {
    await expect(saveIngredient(draft({ name: '   ' }), { kind: 'keep' })).rejects.toThrow('Name fehlt')
  })
})

describe('setArchived', () => {
  it('archiviert und holt zurück', async () => {
    const id = await saveIngredient(draft(), { kind: 'keep' })
    await setArchived(id, true)
    expect((await db.ingredients.get(id))?.archived).toBe(true)
    await setArchived(id, false)
    expect((await db.ingredients.get(id))?.archived).toBe(false)
  })
})

describe('listTags', () => {
  it('liefert Standard-Tags und eigene Tags aus allen Zutaten', async () => {
    await saveIngredient(draft({ tags: ['vegan', 'regional'] }), { kind: 'keep' })
    await saveIngredient(draft({ tags: ['glutenfrei', 'regional'] }), { kind: 'keep' })
    expect(await listTags()).toEqual(['vegan', 'ohne Zuckerzusatz', 'Bio', 'glutenfrei', 'regional'])
  })
})

describe('Kategorien', () => {
  it('legt Kategorien am Ende an und verhindert Doppelte', async () => {
    const flocken = await addCategory('Flocken')
    await addCategory('Nüsse')
    expect(await addCategory(' flocken ')).toBe(flocken)
    expect((await listCategories()).map((c) => c.name)).toEqual(['Flocken', 'Nüsse'])
  })

  it('benennt um, aber nicht auf einen vergebenen Namen', async () => {
    const a = await addCategory('Flocken')
    await addCategory('Nüsse')
    expect(await renameCategory(a, 'nüsse')).toBe(false)
    expect(await renameCategory(a, '')).toBe(false)
    expect(await renameCategory(a, 'Getreide')).toBe(true)
    expect(await renameCategory(a, 'getreide')).toBe(true)
    expect((await listCategories())[0].name).toBe('getreide')
  })

  it('sortiert neu', async () => {
    const a = await addCategory('A')
    const b = await addCategory('B')
    const c = await addCategory('C')
    await reorderCategories([c, a, b])
    expect((await listCategories()).map((x) => x.name)).toEqual(['C', 'A', 'B'])
  })

  it('setzt Zutaten beim Löschen auf „ohne Kategorie“', async () => {
    const nuts = await addCategory('Nüsse')
    const other = await addCategory('Flocken')
    const almond = await saveIngredient(draft({ name: 'Mandeln', categoryId: nuts }), { kind: 'keep' })
    const oats = await saveIngredient(draft({ categoryId: other }), { kind: 'keep' })

    await deleteCategory(nuts)
    expect(await db.categories.get(nuts)).toBeUndefined()
    expect((await db.ingredients.get(almond))?.categoryId).toBeUndefined()
    expect((await db.ingredients.get(oats))?.categoryId).toBe(other)
  })
})

describe('Entwurf (Mix in Arbeit)', () => {
  it('ist am Anfang leer', async () => {
    expect(await loadDraft()).toEqual(emptyDraft())
  })

  it('wird gespeichert, geladen und geleert', async () => {
    const d: MixDraft = { name: 'Test', items: [{ ingredientId: 'a', grams: 50 }] }
    await saveDraft(d)
    expect(await loadDraft()).toEqual(d)
    await clearDraft()
    expect(await loadDraft()).toEqual(emptyDraft())
  })

  it('ergibt bei einem kaputten Eintrag einen leeren Entwurf', async () => {
    await db.settings.put({ key: 'mixDraft', value: { items: 'kaputt' } })
    expect(await loadDraft()).toEqual(emptyDraft())
  })
})

describe('Müslis', () => {
  async function twoIngredients() {
    const oats = await saveIngredient(draft(), { kind: 'keep' })
    const almonds = await saveIngredient(
      draft({ name: 'Mandeln', allergensContains: ['nuts'], nutrition: { ...draft().nutrition, protein: 22 } }),
      { kind: 'keep' },
    )
    return { oats, almonds }
  }

  async function newMix(name = 'Frühstück') {
    const { oats, almonds } = await twoIngredients()
    const d = { ...addItem(addItem(emptyDraft(), oats), almonds), name, forWhom: ' Lena ', note: ' ' }
    await saveDraft(d)
    const id = await saveMix(d)
    return { id, oats, almonds }
  }

  it('speichert ein Müsli mit Snapshots der aktuellen Zutaten und leert den Entwurf', async () => {
    const { id, oats } = await newMix()
    const mix = await db.mixes.get(id)
    expect(mix?.name).toBe('Frühstück')
    expect(mix?.forWhom).toBe('Lena')
    expect(mix).not.toHaveProperty('note')
    expect(mix?.items).toHaveLength(2)
    expect(mix?.items[0]).toMatchObject({ ingredientId: oats, grams: 50, snapshot: { name: 'Haferflocken', allergensContains: ['gluten'] } })
    expect(mix?.items[1].snapshot.nutrition.protein).toBe(22)
    expect(mix?.createdAt).toBeInstanceOf(Date)
    expect(await loadDraft()).toEqual(emptyDraft())
  })

  it('lässt alte Snapshots unverändert, wenn die Zutat später geändert wird', async () => {
    const { id, oats } = await newMix()
    await saveIngredient(draft({ name: 'Hafer neu', nutrition: { ...draft().nutrition, protein: 99 } }), { kind: 'keep' }, oats)
    const mix = await db.mixes.get(id)
    expect(mix?.items[0].snapshot).toMatchObject({ name: 'Haferflocken', nutrition: { protein: 13.5 } })
  })

  it('lehnt Müslis ohne Namen oder ohne Zutaten ab', async () => {
    const { oats } = await twoIngredients()
    await expect(saveMix({ ...addItem(emptyDraft(), oats), name: '  ' })).rejects.toThrow('Name fehlt')
    await expect(saveMix({ ...emptyDraft(), name: 'Leer' })).rejects.toThrow('Keine Zutaten')
    expect(await db.mixes.count()).toBe(0)
  })

  it('lehnt Zeilen ab, deren Zutat fehlt und die keinen Snapshot haben', async () => {
    await expect(saveMix({ name: 'X', items: [{ ingredientId: 'weg', grams: 10 }] })).rejects.toThrow('Zutat nicht gefunden')
  })

  it('speichert Zeilen mit 0 g nicht mit', async () => {
    const { oats, almonds } = await twoIngredients()
    const id = await saveMix({ name: 'X', items: [{ ingredientId: oats, grams: 30 }, { ingredientId: almonds, grams: 0 }] })
    expect((await db.mixes.get(id))?.items.map((i) => i.ingredientId)).toEqual([oats])
  })

  it('Bearbeiten: behält alte Snapshots und das Datum, neue Zutaten bekommen aktuelle Werte', async () => {
    const { id, oats } = await newMix()
    const before = (await db.mixes.get(id))!
    await saveIngredient(draft({ nutrition: { ...draft().nutrition, protein: 99 } }), { kind: 'keep' }, oats)
    const raisins = await saveIngredient(draft({ name: 'Rosinen', allergensContains: ['sulphites'] }), { kind: 'keep' })

    const edit = await editMix(id)
    expect(await loadDraft()).toEqual(edit)
    expect(edit.mixId).toBe(id)
    const savedId = await saveMix({ ...addItem(edit, raisins), name: 'Frühstück 2' })

    expect(savedId).toBe(id)
    expect(await db.mixes.count()).toBe(1)
    const after = (await db.mixes.get(id))!
    expect(after.name).toBe('Frühstück 2')
    expect(after.createdAt).toEqual(before.createdAt)
    expect(after.updatedAt.getTime()).toBeGreaterThanOrEqual(before.updatedAt.getTime())
    expect(after.items[0].snapshot.nutrition.protein).toBe(13.5) // alter Snapshot
    expect(after.items[2].snapshot.name).toBe('Rosinen') // neu hinzugefügt
  })

  it('Bearbeiten scheitert, wenn das Müsli inzwischen gelöscht ist', async () => {
    const { id } = await newMix()
    const edit = await editMix(id)
    await deleteMix(id)
    await expect(saveMix(edit)).rejects.toThrow('Müsli nicht gefunden')
  })

  it('Duplizieren: legt einen neuen Entwurf mit aktuellen Werten an, das Original bleibt', async () => {
    const { id, oats } = await newMix()
    await saveIngredient(draft({ nutrition: { ...draft().nutrition, protein: 99 } }), { kind: 'keep' }, oats)

    const template = await duplicateMix(id)
    expect(template).not.toHaveProperty('mixId')
    expect(template.items.every((i) => i.snapshot === undefined)).toBe(true)
    expect(await loadDraft()).toEqual(template)

    const copyId = await saveMix({ ...template, name: 'Frühstück (neu)' })
    expect(copyId).not.toBe(id)
    expect(await db.mixes.count()).toBe(2)
    expect((await db.mixes.get(copyId))?.items[0].snapshot.nutrition.protein).toBe(99)
    expect((await db.mixes.get(id))?.items[0].snapshot.nutrition.protein).toBe(13.5)
  })

  it('löscht ein Müsli, die Zutaten bleiben', async () => {
    const { id } = await newMix()
    await deleteMix(id)
    expect(await db.mixes.count()).toBe(0)
    expect(await db.ingredients.count()).toBe(2)
  })
})

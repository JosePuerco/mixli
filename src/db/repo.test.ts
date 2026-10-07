// Muss als Erstes geladen werden: stellt eine IndexedDB im Speicher bereit (Node hat keine).
import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from './db'
import {
  addCategory,
  deleteCategory,
  listCategories,
  listTags,
  renameCategory,
  reorderCategories,
  saveIngredient,
  setArchived,
} from './repo'
import type { IngredientDraft } from '../domain/ingredient'

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

  it('speichert ein Foto getrennt und verknüpft es', async () => {
    const id = await saveIngredient(draft(), { kind: 'set', blob: blob('a') })
    const saved = await db.ingredients.get(id)
    expect(saved?.photoId).toBeDefined()
    expect(await db.photos.count()).toBe(1)
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

import { describe, expect, it } from 'vitest'
import type { Ingredient, IngredientSnapshot, Mix } from '../db/types'
import { DEFAULT_GRAMS, MAX_GRAMS } from './mix'
import {
  addItem,
  draftFromMix,
  emptyDraft,
  normalizeDraftText,
  parseDraft,
  resolveLines,
  setGrams,
  stepItem,
  templateFromMix,
  type MixDraft,
} from './mixDraft'

const nutrition = { kcal: 372, kj: 1574, fat: 7, saturatedFat: 1.3, carbs: 58.7, sugar: 0.7, fiber: 10, protein: 13.5, salt: 0.01 }

function ingredient(id: string, overrides: Partial<Ingredient> = {}): Ingredient {
  return {
    id,
    name: `Zutat ${id}`,
    nutrition,
    allergensContains: [],
    allergensTraces: [],
    tags: [],
    archived: false,
    createdAt: new Date(2026, 9, 1),
    updatedAt: new Date(2026, 9, 1),
    ...overrides,
  }
}

const oldSnapshot: IngredientSnapshot = {
  name: 'Hafer (alt)',
  nutrition: { ...nutrition, protein: 11 },
  allergensContains: ['gluten'],
  allergensTraces: [],
}

const savedMix: Mix = {
  id: 'm1',
  name: 'Frühstück',
  forWhom: 'Lena',
  note: 'mit Milch',
  items: [
    { ingredientId: 'a', grams: 300, snapshot: oldSnapshot },
    { ingredientId: 'b', grams: 60, snapshot: { ...oldSnapshot, name: 'Mandeln (alt)' } },
  ],
  createdAt: new Date(2026, 9, 1),
  updatedAt: new Date(2026, 9, 1),
}

const withItems = (...items: MixDraft['items']): MixDraft => ({ ...emptyDraft(), items })

describe('addItem', () => {
  it('fügt die Zutat mit 50 g hinten an', () => {
    const d = addItem(addItem(emptyDraft(), 'a'), 'b')
    expect(d.items).toEqual([
      { ingredientId: 'a', grams: DEFAULT_GRAMS },
      { ingredientId: 'b', grams: DEFAULT_GRAMS },
    ])
  })

  it('fügt eine Zutat nicht doppelt hinzu', () => {
    const d = addItem(emptyDraft(), 'a')
    expect(addItem(d, 'a')).toBe(d)
  })
})

describe('setGrams / stepItem', () => {
  it('setzt die Menge auf 0,1 g genau', () => {
    const d = setGrams(withItems({ ingredientId: 'a', grams: 50 }), 'a', 12.34)
    expect(d.items[0].grams).toBe(12.3)
  })

  it('begrenzt auf 9999,9 g', () => {
    expect(setGrams(withItems({ ingredientId: 'a', grams: 50 }), 'a', 12345).items[0].grams).toBe(MAX_GRAMS)
  })

  it('wirft die Zutat bei 0 g aus dem Mix', () => {
    const d = setGrams(withItems({ ingredientId: 'a', grams: 50 }, { ingredientId: 'b', grams: 10 }), 'a', 0)
    expect(d.items.map((i) => i.ingredientId)).toEqual(['b'])
  })

  it('± ändert um 10 g, bei 0 g fliegt die Zutat raus', () => {
    let d = withItems({ ingredientId: 'a', grams: 15 })
    d = stepItem(d, 'a', 1)
    expect(d.items[0].grams).toBe(25)
    d = stepItem(stepItem(stepItem(d, 'a', -1), 'a', -1), 'a', -1)
    expect(d.items).toEqual([])
  })

  it('behält beim Ändern der Menge den Snapshot', () => {
    const d = stepItem(withItems({ ingredientId: 'a', grams: 50, snapshot: oldSnapshot }), 'a', 1)
    expect(d.items[0].snapshot).toBe(oldSnapshot)
  })

  it('ignoriert unbekannte Zutaten', () => {
    const d = withItems({ ingredientId: 'a', grams: 50 })
    expect(stepItem(d, 'x', 1)).toBe(d)
  })
})

describe('resolveLines', () => {
  const ingredients = new Map([['a', ingredient('a', { name: 'Hafer (neu)' })]])

  it('nimmt ohne eigenen Snapshot die aktuellen Werte der Zutat', () => {
    const [line] = resolveLines(withItems({ ingredientId: 'a', grams: 50 }), ingredients)
    expect(line).toMatchObject({ ingredientId: 'a', grams: 50, snapshot: { name: 'Hafer (neu)' } })
  })

  it('bevorzugt den eigenen Snapshot (Bearbeiten eines gespeicherten Müslis)', () => {
    const [line] = resolveLines(withItems({ ingredientId: 'a', grams: 50, snapshot: oldSnapshot }), ingredients)
    expect(line.snapshot.name).toBe('Hafer (alt)')
  })

  it('lässt Zeilen weg, deren Zutat fehlt und die keinen Snapshot haben', () => {
    expect(resolveLines(withItems({ ingredientId: 'weg', grams: 50 }), ingredients)).toEqual([])
  })
})

describe('draftFromMix (Bearbeiten)', () => {
  it('übernimmt id, Angaben, Mengen und die alten Snapshots', () => {
    const d = draftFromMix(savedMix)
    expect(d).toEqual({
      mixId: 'm1',
      name: 'Frühstück',
      forWhom: 'Lena',
      note: 'mit Milch',
      items: savedMix.items.map((i) => ({ ingredientId: i.ingredientId, grams: i.grams, snapshot: i.snapshot })),
    })
  })
})

describe('templateFromMix (Duplizieren als Vorlage)', () => {
  it('ergibt einen neuen Entwurf ohne mixId und ohne Snapshots', () => {
    const d = templateFromMix(savedMix, new Set(['a', 'b']))
    expect(d).not.toHaveProperty('mixId')
    expect(d.name).toBe('Frühstück')
    expect(d.items).toEqual([
      { ingredientId: 'a', grams: 300 },
      { ingredientId: 'b', grams: 60 },
    ])
  })

  it('behält den alten Snapshot nur für Zutaten, die es nicht mehr gibt', () => {
    const d = templateFromMix(savedMix, new Set(['a']))
    expect(d.items[0]).not.toHaveProperty('snapshot')
    expect(d.items[1].snapshot?.name).toBe('Mandeln (alt)')
  })
})

describe('normalizeDraftText', () => {
  it('trimmt Texte und lässt leere optionale Felder weg', () => {
    const d = normalizeDraftText({ name: '  Müsli   für  Lena ', forWhom: ' ', note: '  ', items: [] })
    expect(d).toEqual({ name: 'Müsli für Lena', items: [] })
  })
})

describe('parseDraft', () => {
  it('liest einen gültigen Entwurf', () => {
    const d = draftFromMix(savedMix)
    expect(parseDraft(structuredClone(d))).toEqual(d)
  })

  it('ergibt bei Unlesbarem einen leeren Entwurf', () => {
    expect(parseDraft(undefined)).toEqual(emptyDraft())
    expect(parseDraft({ name: 'x', items: [{ ingredientId: 'a', grams: -5 }] })).toEqual(emptyDraft())
    expect(parseDraft('kaputt')).toEqual(emptyDraft())
  })
})

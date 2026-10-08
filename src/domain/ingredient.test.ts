import { describe, expect, it } from 'vitest'
import {
  allergenLine,
  byName,
  cardAllergen,
  filterIngredients,
  ingredientCountLabel,
  matchesSearch,
  mergeTags,
  normalizeDraft,
  normalizeTags,
} from './ingredient'
import type { Nutrition } from '../db/types'

const nutrition: Nutrition = {
  kcal: 0, kj: 0, fat: 0, saturatedFat: 0, carbs: 0, sugar: 0, fiber: 0, protein: 0, salt: 0,
}

describe('normalizeTags', () => {
  it('trimmt, entfernt Leere und Doppelte (ohne Groß-/Kleinschreibung)', () => {
    expect(normalizeTags([' Bio ', 'bio', '', 'glutenfrei', '  ', 'Glutenfrei'])).toEqual(['Bio', 'glutenfrei'])
  })
})

describe('mergeTags', () => {
  it('stellt Standard-Tags voran und sortiert eigene alphabetisch', () => {
    expect(mergeTags(['regional', 'BIO', 'Ägypten', 'glutenfrei'])).toEqual([
      'vegan',
      'ohne Zuckerzusatz',
      'Bio',
      'Ägypten',
      'glutenfrei',
      'regional',
    ])
  })
})

describe('normalizeDraft', () => {
  it('trimmt Texte und lässt leere optionale Felder weg', () => {
    const d = normalizeDraft({
      name: '  Zarte   Haferflocken ',
      brand: '  ',
      note: '',
      categoryId: '',
      nutrition,
      allergensContains: [],
      allergensTraces: [],
      tags: ['vegan', 'vegan '],
    })
    expect(d.name).toBe('Zarte Haferflocken')
    expect(d.brand).toBeUndefined()
    expect(d.note).toBeUndefined()
    expect(d.categoryId).toBeUndefined()
    expect(d.tags).toEqual(['vegan'])
  })
})

describe('cardAllergen', () => {
  it('zeigt das erste „enthält“-Allergen und zählt den Rest', () => {
    expect(cardAllergen({ allergensContains: ['gluten', 'nuts'], allergensTraces: ['sesame'] })).toEqual({
      label: 'Gluten',
      kind: 'contains',
      more: 2,
    })
  })

  it('zeigt eine Spur, wenn nichts enthalten ist', () => {
    expect(cardAllergen({ allergensContains: [], allergensTraces: ['nuts'] })).toEqual({
      label: 'Schalenfrüchte',
      kind: 'traces',
      more: 0,
    })
  })

  it('gibt null ohne Allergene', () => {
    expect(cardAllergen({ allergensContains: [], allergensTraces: [] })).toBeNull()
  })
})

describe('matchesSearch', () => {
  const oats = { name: 'Haferflocken', brand: 'Zart, Vollkorn' }

  it('findet Teile von Name und Marke, ohne Groß-/Kleinschreibung', () => {
    expect(matchesSearch(oats, 'hafer')).toBe(true)
    expect(matchesSearch(oats, 'VOLLKORN')).toBe(true)
    expect(matchesSearch(oats, 'mandel')).toBe(false)
  })

  it('zeigt bei leerer Suche alles', () => {
    expect(matchesSearch(oats, '  ')).toBe(true)
  })
})

describe('byName', () => {
  it('sortiert Umlaute deutsch ein', () => {
    const names = ['Rosinen', 'Äpfel', 'Mandeln'].map((name) => ({ name }))
    expect(names.sort(byName).map((n) => n.name)).toEqual(['Äpfel', 'Mandeln', 'Rosinen'])
  })
})

describe('filterIngredients', () => {
  const list = [
    { name: 'Rosinen', categoryId: 'fruit', archived: false },
    { name: 'Mandeln', brand: 'ganz', categoryId: 'nuts', archived: false },
    { name: 'Cashews', categoryId: 'nuts', archived: true },
    { name: 'Haferflocken', archived: false },
  ]

  it('zeigt aktive Zutaten alphabetisch', () => {
    expect(filterIngredients(list, { query: '', archived: false }).map((i) => i.name)).toEqual([
      'Haferflocken',
      'Mandeln',
      'Rosinen',
    ])
  })

  it('filtert nach Kategorie und Suche', () => {
    expect(filterIngredients(list, { query: '', categoryId: 'nuts', archived: false }).map((i) => i.name)).toEqual([
      'Mandeln',
    ])
    expect(filterIngredients(list, { query: 'GANZ', archived: false }).map((i) => i.name)).toEqual(['Mandeln'])
  })

  it('zeigt im Archiv nur archivierte', () => {
    expect(filterIngredients(list, { query: '', archived: true }).map((i) => i.name)).toEqual(['Cashews'])
  })
})

describe('ingredientCountLabel', () => {
  it('unterscheidet Einzahl und Mehrzahl', () => {
    expect(ingredientCountLabel(1)).toBe('1 Zutat')
    expect(ingredientCountLabel(0)).toBe('0 Zutaten')
    expect(ingredientCountLabel(7)).toBe('7 Zutaten')
  })
})

describe('allergenLine', () => {
  it('nennt erst „enthält“, dann Spuren', () => {
    expect(allergenLine({ allergensContains: ['gluten', 'nuts'], allergensTraces: ['sesame'] })).toBe(
      'Gluten · Schalenfrüchte · Spuren: Sesam',
    )
  })

  it('sagt „Keine Allergene“, wenn es keine gibt', () => {
    expect(allergenLine({ allergensContains: [], allergensTraces: [] })).toBe('Keine Allergene')
  })
})

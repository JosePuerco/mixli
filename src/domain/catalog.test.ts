import { describe, expect, it } from 'vitest'
import type { IngredientSnapshot, Mix, Nutrition } from '../db/types'
import { NBSP } from '../lib/format'
import type { AllergenId } from './allergens'
import { buildCatalog, catalogFileName, pageLabel, validateCatalogTitle } from './catalog'
import { buildLabel } from './label'

const zero: Nutrition = { kj: 0, kcal: 0, fat: 0, saturatedFat: 0, carbs: 0, sugar: 0, fiber: 0, protein: 0, salt: 0 }

const snap = (name: string, nutrition: Partial<Nutrition>, contains: AllergenId[] = [], traces: AllergenId[] = []): IngredientSnapshot => ({
  name,
  nutrition: { ...zero, ...nutrition },
  allergensContains: contains,
  allergensTraces: traces,
  price: { kind: 'per100g', euros: 0.5 },
})

const oats = snap('Haferflocken', { kcal: 372, kj: 1574, fat: 7, saturatedFat: 1.3, carbs: 58.7, sugar: 0.7, fiber: 10, protein: 13.5, salt: 0.01 }, ['gluten'])
const almonds = snap('Mandeln', { kcal: 600, kj: 2510, fat: 52, saturatedFat: 4, carbs: 6, sugar: 4, fiber: 12, protein: 22, salt: 0.02 }, ['nuts'], ['peanuts'])

const mix = (id: string, name: string, items: Mix['items'], extra: Partial<Mix> = {}): Mix => ({
  id,
  name,
  items,
  createdAt: new Date(2026, 9, 1),
  updatedAt: new Date(2026, 9, 1),
  ...extra,
})

const basic = mix('b', 'Frühstück Basic', [
  { ingredientId: 'm', grams: 60, snapshot: almonds },
  { ingredientId: 'o', grams: 300, snapshot: oats },
], { forWhom: 'Lena', note: 'geheim', photoId: 'foto-1' })
const pure = mix('p', 'Nur Hafer', [{ ingredientId: 'o', grams: 100, snapshot: oats }])

const plain = (s: string) => s.replaceAll(NBSP, ' ')

describe('buildCatalog', () => {
  const now = new Date(2026, 9, 25, 9, 30)

  it('baut Titelseite und eine Seite je Müsli in der gewählten Reihenfolge', () => {
    const c = buildCatalog('  Herbst   2026 ', [pure, basic], now)
    expect(c.title).toBe('Herbst 2026')
    expect(c.date).toBe('25.10.2026')
    expect(c.pageCount).toBe(3)
    expect(c.entries.map((e) => [e.name, e.page])).toEqual([
      ['Nur Hafer', 2],
      ['Frühstück Basic', 3],
    ])
  })

  it('übernimmt Zutaten, Allergene und Spuren wie auf dem Etikett', () => {
    const [entry] = buildCatalog('K', [basic], now).entries
    const label = buildLabel(basic)!
    expect(entry.ingredients).toEqual(label.ingredients)
    expect(entry.ingredients.map((i) => i.name)).toEqual(['Haferflocken', 'Mandeln'])
    expect(entry.contains).toEqual(['Gluten', 'Schalenfrüchte'])
    expect(entry.traces).toBe('Kann Spuren von Erdnüssen enthalten.')
    expect(entry.photoId).toBe('foto-1')
  })

  it('zeigt die volle Nährwerttabelle ohne Abkürzungen, gerundet', () => {
    const [entry] = buildCatalog('K', [pure], now).entries
    expect(entry.nutrition.map((r) => r.label)).toEqual([
      'Energie', 'Fett', 'davon gesättigte Fettsäuren', 'Kohlenhydrate', 'davon Zucker', 'Ballaststoffe', 'Eiweiß', 'Salz',
    ])
    expect(plain(entry.nutrition[0].value)).toBe('1574 kJ / 372 kcal')
    expect(plain(entry.nutrition[6].value)).toBe('14 g')
  })

  it('enthält keine privaten Angaben (Preis, für wen, Notiz)', () => {
    const text = JSON.stringify(buildCatalog('K', [basic], now))
    expect(text).not.toMatch(/Lena|geheim|euros|€/)
  })

  it('lässt Müslis ohne Menge weg', () => {
    const empty = mix('e', 'Leer', [{ ingredientId: 'o', grams: 0, snapshot: oats }])
    const c = buildCatalog('K', [empty, pure], now)
    expect(c.entries.map((e) => [e.name, e.page])).toEqual([['Nur Hafer', 2]])
    expect(c.pageCount).toBe(2)
  })
})

describe('validateCatalogTitle', () => {
  it('verlangt einen Titel und begrenzt die Länge', () => {
    expect(validateCatalogTitle('  ')).toBe('Bitte einen Titel eingeben')
    expect(validateCatalogTitle('x'.repeat(81))).toBe('Höchstens 80 Zeichen')
    expect(validateCatalogTitle('Herbst')).toBeUndefined()
  })
})

describe('Texte', () => {
  it('Seitenzahl und Dateiname', () => {
    expect(pageLabel(2, 5)).toBe('Seite 2 von 5')
    expect(catalogFileName('Müsli-Sortiment Herbst')).toBe('mixli-katalog-muesli-sortiment-herbst.pdf')
    expect(catalogFileName('!!!')).toBe('mixli-katalog.pdf')
  })
})

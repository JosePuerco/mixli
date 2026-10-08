import { describe, expect, it } from 'vitest'
import type { Ingredient, IngredientSnapshot, Nutrition } from '../db/types'
import type { AllergenId } from './allergens'
import {
  MAX_GRAMS,
  mixAllergens,
  normalizeGrams,
  nutritionPer100g,
  shares,
  snapshotOf,
  stepGrams,
  totalGrams,
  type MixLine,
} from './mix'
import { formatNutrient } from './rounding'

const zero: Nutrition = {
  kj: 0, kcal: 0, fat: 0, saturatedFat: 0, carbs: 0, sugar: 0, fiber: 0, protein: 0, salt: 0,
}

function snap(
  name: string,
  nutrition: Partial<Nutrition>,
  contains: AllergenId[] = [],
  traces: AllergenId[] = [],
): IngredientSnapshot {
  return { name, nutrition: { ...zero, ...nutrition }, allergensContains: contains, allergensTraces: traces }
}

const line = (grams: number, snapshot: IngredientSnapshot): MixLine => ({ grams, snapshot })

const oats = snap('Haferflocken', { kcal: 372, kj: 1574, fat: 7, saturatedFat: 1.3, carbs: 58.7, sugar: 0.7, fiber: 10, protein: 13.5, salt: 0.01 }, ['gluten'])
const almonds = snap('Mandeln', { kcal: 600, kj: 2510, fat: 52, saturatedFat: 4, carbs: 6, sugar: 4, fiber: 12, protein: 22, salt: 0.02 }, ['nuts'], ['peanuts'])
const raisins = snap('Rosinen', { kcal: 300, kj: 1270, fat: 0.5, saturatedFat: 0.1, carbs: 69, sugar: 65, fiber: 4, protein: 2.5, salt: 0.05 }, ['sulphites'], ['nuts'])

/** Beispiel aus PLAN.md („Berechnung“). */
const planExample = [line(300, oats), line(60, almonds), line(40, raisins)]

describe('totalGrams', () => {
  it('summiert die Mengen', () => {
    expect(totalGrams(planExample)).toBe(400)
  })

  it('ist 0 für einen leeren Mix', () => {
    expect(totalGrams([])).toBe(0)
  })

  it('ignoriert Zeilen mit 0 g', () => {
    expect(totalGrams([line(100, oats), line(0, almonds)])).toBe(100)
  })
})

describe('shares', () => {
  it('liefert Anteile von 0 bis 1 in derselben Reihenfolge', () => {
    expect(shares(planExample)).toEqual([0.75, 0.15, 0.1])
  })

  it('ergibt zusammen 1', () => {
    const s = shares([line(33.3, oats), line(33.3, almonds), line(33.4, raisins)])
    expect(s.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12)
  })

  it('liefert 0 für alle Zeilen eines leeren Mixes, ohne durch 0 zu teilen', () => {
    expect(shares([line(0, oats)])).toEqual([0])
  })
})

describe('nutritionPer100g', () => {
  it('rechnet das Beispiel aus PLAN.md: 13,675 g Eiweiß, angezeigt „14 g“', () => {
    const n = nutritionPer100g(planExample)!
    // (300 × 13,5 + 60 × 22 + 40 × 2,5) ÷ 400 = (4050 + 1320 + 100) ÷ 400
    expect(n.protein).toBeCloseTo(13.675, 12)
    expect(formatNutrient('protein', n.protein)).toBe('14 g')
  })

  it('rechnet intern exakt, ohne Zwischenrundung', () => {
    const n = nutritionPer100g(planExample)!
    expect(n.kcal).toBeCloseTo((300 * 372 + 60 * 600 + 40 * 300) / 400, 12) // 399
    expect(n.salt).toBeCloseTo((300 * 0.01 + 60 * 0.02 + 40 * 0.05) / 400, 12) // 0,0155
    expect(n.saturatedFat).toBeCloseTo((300 * 1.3 + 60 * 4 + 40 * 0.1) / 400, 12)
  })

  it('übernimmt kJ gewichtet aus den Zutaten, statt es aus kcal neu zu berechnen', () => {
    const n = nutritionPer100g(planExample)!
    expect(n.kj).toBeCloseTo((300 * 1574 + 60 * 2510 + 40 * 1270) / 400, 12)
  })

  it('hängt nur vom Verhältnis ab, nicht von der Gesamtmenge', () => {
    const doubled = planExample.map((l) => line(l.grams * 2, l.snapshot))
    const a = nutritionPer100g(planExample)!
    const b = nutritionPer100g(doubled)!
    for (const key of Object.keys(a) as (keyof Nutrition)[]) expect(b[key]).toBeCloseTo(a[key], 12)
  })

  it('entspricht bei einer einzigen Zutat genau deren Werten', () => {
    expect(nutritionPer100g([line(123.4, oats)])).toEqual(oats.nutrition)
  })

  it('ist null für einen leeren Mix', () => {
    expect(nutritionPer100g([])).toBeNull()
    expect(nutritionPer100g([line(0, oats)])).toBeNull()
  })

  it('kann Werte unter der Anzeigegrenze ergeben (Salz 0,0125 g → „<0,01 g“)', () => {
    const salty = snap('Salzig', { salt: 0.025 })
    const n = nutritionPer100g([line(50, salty), line(50, snap('ohne Salz', {}))])!
    expect(n.salt).toBeCloseTo(0.0125, 12)
    expect(formatNutrient('salt', n.salt)).toBe('<0,01 g')
  })
})

describe('mixAllergens', () => {
  it('sammelt Allergene in der festen EU-Reihenfolge, ohne Doppelte', () => {
    const r = mixAllergens([line(10, raisins), line(10, oats), line(10, almonds), line(10, oats)])
    expect(r.contains).toEqual(['gluten', 'nuts', 'sulphites'])
  })

  it('führt Spuren getrennt und lässt Spuren weg, die schon enthalten sind', () => {
    // Rosinen: Spuren Schalenfrüchte – die Mandeln enthalten sie aber sicher.
    const r = mixAllergens(planExample)
    expect(r.contains).toEqual(['gluten', 'nuts', 'sulphites'])
    expect(r.traces).toEqual(['peanuts'])
  })

  it('zeigt Spuren, solange keine Zutat das Allergen enthält', () => {
    const r = mixAllergens([line(100, oats), line(20, raisins)])
    expect(r.traces).toEqual(['nuts'])
  })

  it('ignoriert Zutaten mit 0 g', () => {
    const r = mixAllergens([line(100, oats), line(0, almonds)])
    expect(r).toEqual({ contains: ['gluten'], traces: [] })
  })

  it('ist leer für einen leeren Mix', () => {
    expect(mixAllergens([])).toEqual({ contains: [], traces: [] })
  })
})

describe('snapshotOf', () => {
  const ingredient: Ingredient = {
    id: 'i1',
    name: 'Haferflocken',
    brand: 'Kölln',
    categoryId: 'c1',
    photoId: 'p1',
    nutrition: { ...oats.nutrition },
    allergensContains: ['gluten'],
    allergensTraces: ['nuts'],
    tags: ['vegan'],
    note: 'Notiz',
    archived: false,
    createdAt: new Date(2026, 9, 1),
    updatedAt: new Date(2026, 9, 1),
  }

  it('übernimmt Name, Marke, Nährwerte und Allergene, sonst nichts', () => {
    expect(snapshotOf(ingredient)).toEqual({
      name: 'Haferflocken',
      brand: 'Kölln',
      nutrition: oats.nutrition,
      allergensContains: ['gluten'],
      allergensTraces: ['nuts'],
    })
  })

  it('lässt eine fehlende Marke weg', () => {
    expect(snapshotOf({ ...ingredient, brand: undefined })).not.toHaveProperty('brand')
  })

  it('bleibt unverändert, wenn die Zutat danach geändert wird', () => {
    const copy = { ...ingredient, nutrition: { ...ingredient.nutrition }, allergensContains: [...ingredient.allergensContains] }
    const s = snapshotOf(copy)
    copy.nutrition.protein = 99
    copy.allergensContains.push('milk')
    expect(s.nutrition.protein).toBe(13.5)
    expect(s.allergensContains).toEqual(['gluten'])
  })
})

describe('Mengen', () => {
  it('± ändert in 10-g-Schritten, ohne auf Zehner zu springen', () => {
    expect(stepGrams(50, 1)).toBe(60)
    expect(stepGrams(25, 1)).toBe(35)
    expect(stepGrams(12.5, -1)).toBe(2.5)
  })

  it('geht nicht unter 0 g (die Zutat fliegt dann aus dem Mix)', () => {
    expect(stepGrams(10, -1)).toBe(0)
    expect(stepGrams(5, -1)).toBe(0)
  })

  it('bleibt bei Kommawerten frei von Gleitkomma-Rauschen', () => {
    expect(stepGrams(0.3, 1)).toBe(10.3)
    expect(stepGrams(10.3, -1)).toBe(0.3) // nicht 0,3000000000000007
  })

  it('normalisiert auf 0,1 g zwischen 0 und 9999,9 g', () => {
    expect(normalizeGrams(12.34)).toBe(12.3)
    expect(normalizeGrams(12.35)).toBe(12.4)
    expect(normalizeGrams(-3)).toBe(0)
    expect(normalizeGrams(20000)).toBe(MAX_GRAMS)
    expect(stepGrams(MAX_GRAMS, 1)).toBe(MAX_GRAMS)
    expect(normalizeGrams(Number.NaN)).toBe(0)
  })
})

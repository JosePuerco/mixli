// Mix-Berechnung: Gesamtgewicht, Anteile, Nährwerte pro 100 g und Allergene. Alles exakt, nicht gerundet;
// gerundet wird nur bei der Anzeige (rounding.ts). Gerechnet wird immer mit Snapshots, live wie gespeichert.
import type { Ingredient, IngredientSnapshot, MixItem, Nutrition } from '../db/types'
import { ALLERGENS, type AllergenId } from './allergens'
import { NUTRIENT_FIELDS } from './nutrition'
import { roundHalfUp } from './rounding'

/** Was die Berechnung von einer Zeile braucht. Passt auf gespeicherte MixItems und den Live-Mix. */
export type MixLine = Pick<MixItem, 'grams' | 'snapshot'>

/** Menge einer frisch hinzugefügten Zutat (wie im Prototyp). */
export const DEFAULT_GRAMS = 50
/** ± im Stepper. */
export const GRAMS_STEP = 10
/** Mengen-Sheet: höchstens 4 Vorkommastellen und 1 Nachkommastelle. */
export const MAX_GRAMS = 9999.9

/** Kopie der Werte, die ein gespeichertes Müsli braucht. Listen werden kopiert, nicht geteilt. */
export function snapshotOf(i: Ingredient): IngredientSnapshot {
  return {
    name: i.name,
    ...(i.brand !== undefined && { brand: i.brand }),
    nutrition: { ...i.nutrition },
    allergensContains: [...i.allergensContains],
    allergensTraces: [...i.allergensTraces],
  }
}

/** Menge auf 0,1 g, nicht unter 0 und nicht über MAX_GRAMS. */
export function normalizeGrams(grams: number): number {
  if (!Number.isFinite(grams)) return 0
  return Math.min(MAX_GRAMS, Math.max(0, roundHalfUp(grams, 1)))
}

/** Stepper: 25 g + 10 → 35 g, 5 g − 10 → 0 g (die Zutat fliegt dann aus dem Mix). */
export function stepGrams(grams: number, direction: 1 | -1): number {
  return normalizeGrams(grams + direction * GRAMS_STEP)
}

/** Zeilen, die zählen: Mengen über 0 g. */
const active = <T extends MixLine>(items: readonly T[]) => items.filter((i) => i.grams > 0)

export function totalGrams(items: readonly MixLine[]): number {
  return active(items).reduce((sum, i) => sum + i.grams, 0)
}

/** Anteil jeder Zeile am Gesamtgewicht (0–1), in derselben Reihenfolge. Leerer Mix: alle 0. */
export function shares(items: readonly MixLine[]): number[] {
  const total = totalGrams(items)
  return items.map((i) => (total > 0 && i.grams > 0 ? i.grams / total : 0))
}

/**
 * Nährwerte pro 100 g Mischung: das nach Gewicht gewichtete Mittel der Zutatenwerte.
 * null, solange der Mix leer ist (es gibt dann nichts zu teilen).
 */
export function nutritionPer100g(items: readonly MixLine[]): Nutrition | null {
  const lines = active(items)
  const total = totalGrams(lines)
  if (total <= 0) return null
  const result = {} as Nutrition
  for (const { key } of NUTRIENT_FIELDS) {
    result[key] = lines.reduce((sum, i) => sum + i.snapshot.nutrition[key] * i.grams, 0) / total
  }
  return result
}

export interface MixAllergens {
  contains: AllergenId[]
  /** Nur Spuren, die nicht schon unter „enthält“ stehen. */
  traces: AllergenId[]
}

/** Gesammelte Allergene des Mixes, ohne Doppelte, in der festen Reihenfolge der 14 EU-Allergene. */
export function mixAllergens(items: readonly MixLine[]): MixAllergens {
  const lines = active(items)
  const contains = new Set(lines.flatMap((i) => i.snapshot.allergensContains))
  const traces = new Set(lines.flatMap((i) => i.snapshot.allergensTraces))
  return {
    contains: ALLERGENS.map((a) => a.id).filter((id) => contains.has(id)),
    traces: ALLERGENS.map((a) => a.id).filter((id) => traces.has(id) && !contains.has(id)),
  }
}

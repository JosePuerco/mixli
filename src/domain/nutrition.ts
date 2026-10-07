// Nährwerte einer Zutat: Felder, Prüfung und Umrechnung kcal → kJ. Alles pro 100 g, intern exakt.
import { z } from 'zod'
import type { Nutrition } from '../db/types'
import { parseDecimal, toDecimalInput } from '../lib/parse'

export type NutrientKey = keyof Nutrition

export interface NutrientField {
  key: NutrientKey
  label: string
  unit: 'kcal' | 'kJ' | 'g'
  /** „davon“-Zeile: eingerückt und gedämpft. */
  sub?: boolean
}

/** Reihenfolge wie auf der Packung und in DESIGN.md (Schritt 3). */
export const NUTRIENT_FIELDS: readonly NutrientField[] = [
  { key: 'kcal', label: 'Energie', unit: 'kcal' },
  { key: 'kj', label: 'Energie', unit: 'kJ' },
  { key: 'fat', label: 'Fett', unit: 'g' },
  { key: 'saturatedFat', label: 'davon gesättigte Fettsäuren', unit: 'g', sub: true },
  { key: 'carbs', label: 'Kohlenhydrate', unit: 'g' },
  { key: 'sugar', label: 'davon Zucker', unit: 'g', sub: true },
  { key: 'fiber', label: 'Ballaststoffe', unit: 'g' },
  { key: 'protein', label: 'Eiweiß', unit: 'g' },
  { key: 'salt', label: 'Salz', unit: 'g' },
]

export const KJ_PER_KCAL = 4.184

/** kJ aus kcal (Vorschlag, wenn die Packung nur kcal nennt). Ungerundet. */
export function kcalToKj(kcal: number): number {
  return kcal * KJ_PER_KCAL
}

const grams = z.number().min(0, 'Darf nicht negativ sein').max(100, 'Höchstens 100 g')

/** Gültige Nährwerte pro 100 g. Auch für den Backup-Import gedacht. */
export const nutritionSchema = z
  .object({
    kcal: z.number().min(0, 'Darf nicht negativ sein').max(900, 'Höchstens 900 kcal'),
    kj: z.number().min(0, 'Darf nicht negativ sein').max(3800, 'Höchstens 3800 kJ'),
    fat: grams,
    saturatedFat: grams,
    carbs: grams,
    sugar: grams,
    fiber: grams,
    protein: grams,
    salt: grams,
  })
  .refine((n) => n.saturatedFat <= n.fat, { error: 'Mehr als Fett', path: ['saturatedFat'] })
  .refine((n) => n.sugar <= n.carbs, { error: 'Mehr als Kohlenhydrate', path: ['sugar'] })

/** Formularwerte als Text, so wie getippt. */
export type NutritionInput = Record<NutrientKey, string>
export type NutritionErrors = Partial<Record<NutrientKey, string>>

export type NutritionResult = { ok: true; value: Nutrition } | { ok: false; errors: NutritionErrors }

export function emptyNutritionInput(): NutritionInput {
  return Object.fromEntries(NUTRIENT_FIELDS.map((f) => [f.key, ''])) as NutritionInput
}

export function nutritionToInput(n: Nutrition): NutritionInput {
  return Object.fromEntries(NUTRIENT_FIELDS.map((f) => [f.key, toDecimalInput(n[f.key])])) as NutritionInput
}

/**
 * Prüft die Eingaben. Alle Felder sind Pflicht, außer kJ: Bleibt kJ leer, wird es aus kcal berechnet.
 * Fehler beim Lesen der Zahl („Bitte ausfüllen“) haben Vorrang vor Bereichsfehlern.
 */
export function parseNutritionInput(input: NutritionInput): NutritionResult {
  const values = {} as Nutrition
  const errors: NutritionErrors = {}

  for (const { key } of NUTRIENT_FIELDS) {
    const v = parseDecimal(input[key])
    if (v === undefined) {
      if (key !== 'kj') errors[key] = 'Bitte ausfüllen'
      values[key] = Number.NaN
    } else if (Number.isNaN(v)) {
      errors[key] = 'Bitte eine Zahl eingeben'
      values[key] = Number.NaN
    } else {
      values[key] = v
    }
  }

  if (input.kj.trim() === '' && Number.isFinite(values.kcal)) values.kj = kcalToKj(values.kcal)
  else if (input.kj.trim() === '') errors.kj ??= 'Bitte kcal oder kJ angeben'

  const result = nutritionSchema.safeParse(values)
  if (result.success && Object.keys(errors).length === 0) return { ok: true, value: result.data }

  const schemaErrors: NutritionErrors = {}
  for (const issue of result.error?.issues ?? []) {
    const key = issue.path[0] as NutrientKey
    schemaErrors[key] ??= issue.message
  }
  return { ok: false, errors: { ...schemaErrors, ...errors } }
}

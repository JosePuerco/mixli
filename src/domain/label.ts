// Inhalt des Etiketts (70 × 42,3 mm) als fertige Texte: Name, Gesamtmenge, Zutatenliste mit Anteilen,
// eine zentrale Zeile „Enthält: …“, Spuren-Satz, Herstellungsdatum und Nährwerttabelle pro 100 g.
// Allergene stehen bewusst nicht hinter jeder Zutat, sondern einmal gesammelt (sonst doppelt, z. B.
// „Zutat 1 (Krebstiere), Zutat 2 (Eier, Krebstiere)“) – für selbst gemischtes Müsli übersichtlicher. Gerechnet wird mit den Snapshots,
// gerundet nur hier für die Anzeige (rounding.ts). Die Darstellung übernimmt components/label/Label.tsx.
import type { Mix } from '../db/types'
import { formatDate } from '../lib/format'
import { allergenDative, allergenLabel } from './allergens'
import { mixAllergens, nutritionPer100g, totalGrams } from './mix'
import { NUTRIENT_FIELDS, type NutrientKey } from './nutrition'
import { formatGrams, formatNutrient, formatShare } from './rounding'

export interface LabelIngredient {
  name: string
  /** „75 %“, „<1 %“. */
  share: string
}

export interface LabelNutrientRow {
  label: string
  value: string
  /** „davon“-Zeile, eingerückt. */
  sub: boolean
}

export interface LabelData {
  name: string
  /** Gesamtmenge, z. B. „400 g“. */
  total: string
  /** Absteigend nach Gewicht, wie auf Zutatenlisten vorgeschrieben. */
  ingredients: LabelIngredient[]
  /** Enthaltene Allergene des ganzen Müslis, ohne Doppelte, in der festen Reihenfolge; leer ohne Allergene. */
  contains: string[]
  /** „Kann Spuren von Erdnüssen und Sesam enthalten.“ oder null ohne Spuren. */
  traces: string | null
  /** „Hergestellt am 07.10.2026.“ (Tag des ersten Speicherns). */
  madeOn: string
  /** Energie (kJ / kcal) und die 7 weiteren Pflichtwerte. */
  nutrition: LabelNutrientRow[]
}

export const LABEL_SOURCE_NOTE = 'Nährwerte aus Herstellerangaben berechnet.'

/** Auf dem Etikett ist kein Platz für „davon gesättigte Fettsäuren“. */
const SHORT_LABELS: Partial<Record<NutrientKey, string>> = { saturatedFat: 'davon gesättigte Fetts.' }

/** „A“, „A und B“, „A, B und C“. */
export function joinGerman(parts: readonly string[]): string {
  if (parts.length <= 1) return parts.join('')
  return `${parts.slice(0, -1).join(', ')} und ${parts[parts.length - 1]}`
}

/** Etikett-Inhalt eines gespeicherten Müslis. null, wenn das Müsli keine Menge hat (nichts zu etikettieren). */
export function buildLabel(mix: Pick<Mix, 'name' | 'items' | 'createdAt'>): LabelData | null {
  const items = mix.items.filter((i) => i.grams > 0)
  const nutrition = nutritionPer100g(items)
  if (!nutrition) return null
  const total = totalGrams(items)

  // sort ist stabil: Gleich schwere Zutaten bleiben in der Reihenfolge des Mixes.
  const ingredients = [...items]
    .sort((a, b) => b.grams - a.grams)
    .map((i) => ({ name: i.snapshot.name, share: formatShare(i.grams / total) }))

  // Spuren ohne Allergene, die schon enthalten sind (sonst stünde Krebstiere unter „Enthält“ und „Spuren“).
  const { contains, traces } = mixAllergens(items)

  return {
    name: mix.name,
    total: formatGrams(total),
    ingredients,
    contains: contains.map(allergenLabel),
    traces: traces.length > 0 ? `Kann Spuren von ${joinGerman(traces.map(allergenDative))} enthalten.` : null,
    madeOn: `Hergestellt am ${formatDate(mix.createdAt)}.`,
    nutrition: [
      { label: 'Energie', value: `${formatNutrient('kj', nutrition.kj)} / ${formatNutrient('kcal', nutrition.kcal)}`, sub: false },
      ...NUTRIENT_FIELDS.filter((f) => f.unit === 'g').map((f) => ({
        label: SHORT_LABELS[f.key] ?? f.label,
        value: formatNutrient(f.key, nutrition[f.key]),
        sub: f.sub ?? false,
      })),
    ],
  }
}

const UMLAUTS: Record<string, string> = { ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' }

/** Dateiname für PDF und Bild: „mixli-etikett-fruehstueck-basic.pdf“. */
export function labelFileName(name: string, extension: 'pdf' | 'png'): string {
  const slug = name
    .toLowerCase()
    .replace(/[äöüß]/g, (c) => UMLAUTS[c])
    .normalize('NFKD')
    // Übrige Akzente entfernen: „Crème“ → „creme“.
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '')
  return `mixli-etikett${slug ? `-${slug}` : ''}.${extension}`
}

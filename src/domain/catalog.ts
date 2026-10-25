// Inhalt des Produktkatalogs (A4-PDF): Titelseite mit Titel, Datum und Übersicht, danach ein Müsli pro Seite
// mit Zutaten und Anteilen, Allergenen, Spuren und voller Nährwerttabelle pro 100 g. Texte wie auf dem Etikett
// (label.ts), aus den Snapshots. Preis, „für wen“ und Notiz sind privat und stehen bewusst nicht drin.
// Die Darstellung übernimmt components/catalog/CatalogPages.tsx.
import type { Mix } from '../db/types'
import { formatDate } from '../lib/format'
import { buildLabel, fileSlug, nutritionRows, type LabelIngredient, type LabelNutrientRow } from './label'
import { nutritionPer100g } from './mix'

export interface CatalogEntry {
  mixId: string
  name: string
  photoId?: string
  /** Absteigend nach Gewicht, mit Anteilen. */
  ingredients: LabelIngredient[]
  contains: string[]
  traces: string | null
  nutrition: LabelNutrientRow[]
  /** Seitenzahl im PDF (die Titelseite ist Seite 1). */
  page: number
}

export interface CatalogData {
  title: string
  /** „25.10.2026“ */
  date: string
  entries: CatalogEntry[]
  /** Alle Seiten inkl. Titelseite. */
  pageCount: number
}

export const CATALOG_TITLE_MAX_LENGTH = 80
export const DEFAULT_CATALOG_TITLE = 'Müsli-Katalog'

/** Fehlermeldung zum Titel oder undefined. */
export function validateCatalogTitle(title: string): string | undefined {
  if (!title.trim()) return 'Bitte einen Titel eingeben'
  if (title.trim().length > CATALOG_TITLE_MAX_LENGTH) return `Höchstens ${CATALOG_TITLE_MAX_LENGTH} Zeichen`
  return undefined
}

/** Katalog aus den gewählten Müslis, in der übergebenen Reihenfolge. Müslis ohne Menge fallen weg. */
export function buildCatalog(title: string, mixes: readonly Mix[], now: Date): CatalogData {
  const entries: CatalogEntry[] = []
  for (const mix of mixes) {
    const label = buildLabel(mix)
    const nutrition = nutritionPer100g(mix.items)
    if (!label || !nutrition) continue
    entries.push({
      mixId: mix.id,
      name: mix.name,
      ...(mix.photoId && { photoId: mix.photoId }),
      ingredients: label.ingredients,
      contains: label.contains,
      traces: label.traces,
      // Auf A4 ist Platz für die vollen Bezeichnungen (das Etikett kürzt „gesättigte Fettsäuren“).
      nutrition: nutritionRows(nutrition),
      page: entries.length + 2,
    })
  }
  return { title: title.trim().replace(/\s+/g, ' '), date: formatDate(now), entries, pageCount: entries.length + 1 }
}

/** „Seite 2 von 5“ */
export function pageLabel(page: number, pageCount: number): string {
  return `Seite ${page} von ${pageCount}`
}

/** „mixli-katalog-herbst-2026.pdf“ */
export function catalogFileName(title: string): string {
  const slug = fileSlug(title)
  return `mixli-katalog${slug ? `-${slug}` : ''}.pdf`
}

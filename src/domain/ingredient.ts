// Zutaten: Standard-Tags, Aufbereitung von Formulardaten und Anzeige-Hilfen für Liste und Karte.
import type { Ingredient } from '../db/types'
import { ALLERGENS, type AllergenId } from './allergens'

/** Feste Vorschläge, stehen immer zur Auswahl. Eigene Tags kommen aus den gespeicherten Zutaten. */
export const DEFAULT_TAGS = ['vegan', 'ohne Zuckerzusatz', 'Bio'] as const

/** Alles, was im Formular bearbeitet wird. Foto, Archiv-Status und Zeitstempel verwaltet repo.ts. */
export type IngredientDraft = Pick<
  Ingredient,
  'name' | 'brand' | 'categoryId' | 'nutrition' | 'allergensContains' | 'allergensTraces' | 'tags' | 'note'
>

/** Leerzeichen und Groß-/Kleinschreibung zählen beim Vergleich von Namen nicht. */
export function sameName(a: string, b: string): boolean {
  return a.trim().toLocaleLowerCase('de') === b.trim().toLocaleLowerCase('de')
}

/** Tag-Liste bereinigen: getrimmt, ohne leere Einträge und ohne Doppelte (erster gewinnt). */
export function normalizeTags(tags: readonly string[]): string[] {
  const out: string[] = []
  for (const raw of tags) {
    const t = raw.trim().replace(/\s+/g, ' ')
    if (t && !out.some((o) => sameName(o, t))) out.push(t)
  }
  return out
}

/** Alle wählbaren Tags: Standard-Tags zuerst, dann eigene alphabetisch. */
export function mergeTags(stored: readonly string[]): string[] {
  const own = normalizeTags(stored)
    .filter((t) => !DEFAULT_TAGS.some((d) => sameName(d, t)))
    .sort((a, b) => a.localeCompare(b, 'de'))
  return [...DEFAULT_TAGS, ...own]
}

/** Formulardaten aufräumen: Texte trimmen, leere optionale Felder weglassen. */
export function normalizeDraft(draft: IngredientDraft): IngredientDraft {
  const brand = draft.brand?.trim()
  const note = draft.note?.trim()
  return {
    ...draft,
    name: draft.name.trim().replace(/\s+/g, ' '),
    brand: brand || undefined,
    note: note || undefined,
    categoryId: draft.categoryId || undefined,
    tags: normalizeTags(draft.tags),
  }
}

const allergenLabel = (id: AllergenId) => ALLERGENS.find((a) => a.id === id)?.label ?? id

export interface CardAllergen {
  label: string
  kind: 'contains' | 'traces'
  /** Wie viele weitere Allergene (enthält + Spuren) es gibt, für „+2“. */
  more: number
}

/**
 * Ein Allergen-Chip für die Zutatenkarte: das erste „enthält“-Allergen,
 * sonst die erste Spur („Spuren: …“). null, wenn es keine gibt.
 */
export function cardAllergen(i: Pick<Ingredient, 'allergensContains' | 'allergensTraces'>): CardAllergen | null {
  const total = i.allergensContains.length + i.allergensTraces.length
  if (total === 0) return null
  const contains = i.allergensContains.length > 0
  const first = contains ? i.allergensContains[0] : i.allergensTraces[0]
  return { label: allergenLabel(first), kind: contains ? 'contains' : 'traces', more: total - 1 }
}

/** Live-Suche: Name oder Marke enthält den Suchtext, ohne Rücksicht auf Groß-/Kleinschreibung. */
export function matchesSearch(i: Pick<Ingredient, 'name' | 'brand'>, query: string): boolean {
  const q = query.trim().toLocaleLowerCase('de')
  if (!q) return true
  return `${i.name} ${i.brand ?? ''}`.toLocaleLowerCase('de').includes(q)
}

/** Sortierung der Liste: alphabetisch nach Name, deutsch (Umlaute richtig einsortiert). */
export function byName(a: Pick<Ingredient, 'name'>, b: Pick<Ingredient, 'name'>): number {
  return a.name.localeCompare(b.name, 'de')
}

export interface IngredientFilter {
  query: string
  /** undefined = alle Kategorien. */
  categoryId?: string
  /** true = nur archivierte, false = nur aktive. */
  archived: boolean
}

/** Liste für die Übersicht: gefiltert und alphabetisch sortiert. */
export function filterIngredients<T extends Pick<Ingredient, 'name' | 'brand' | 'categoryId' | 'archived'>>(
  list: readonly T[],
  { query, categoryId, archived }: IngredientFilter,
): T[] {
  return list
    .filter((i) => i.archived === archived)
    .filter((i) => categoryId === undefined || i.categoryId === categoryId)
    .filter((i) => matchesSearch(i, query))
    .sort(byName)
}

/** „1 Zutat“, „7 Zutaten“. */
export function ingredientCountLabel(n: number): string {
  return n === 1 ? '1 Zutat' : `${n} Zutaten`
}

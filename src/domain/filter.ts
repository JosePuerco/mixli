// Filter beim Mixen: Allergene ausschließen (wahlweise auch als Spuren) und Tags verlangen.
// Reine Funktionen: Prüfung einer Zutat, Prüfung eines gespeicherten Müslis, Texte für Chips und Hinweise.
// Gespeicherte Müslis werden bei Allergenen nach ihrem Snapshot geprüft (das steht auf dem Etikett),
// bei Tags nach der aktuellen Zutat (Tags sind Vorlieben und stehen nicht im Snapshot).
import type { Ingredient, MixItem } from '../db/types'
import { ALLERGENS, allergenLabel, type AllergenId } from './allergens'
import { normalizeTags, sameName } from './ingredient'

export interface MixFilter {
  excludedAllergens: AllergenId[]
  /** true = auch Zutaten mit Spuren der ausgeschlossenen Allergene sind ausgeschlossen. */
  excludeTraces: boolean
  /** Eine Zutat muss alle diese Tags haben. */
  requiredTags: string[]
}

export const EMPTY_FILTER: MixFilter = { excludedAllergens: [], excludeTraces: false, requiredTags: [] }

/** Warum eine Zutat nicht zum Filter passt. */
export type FilterReason =
  | { kind: 'contains'; allergen: AllergenId }
  | { kind: 'traces'; allergen: AllergenId }
  | { kind: 'missingTag'; tag: string }

/** Was die Prüfung von einer Zutat braucht. tags fehlt, wenn die Zutat nicht mehr existiert. */
export type FilterSubject = Pick<Ingredient, 'allergensContains' | 'allergensTraces'> & { tags?: readonly string[] }

/** Ist überhaupt etwas eingestellt? (Der Spuren-Schalter allein filtert nichts.) */
export function isFilterActive(f: MixFilter): boolean {
  return f.excludedAllergens.length > 0 || f.requiredTags.length > 0
}

/** Gründe, warum die Zutat nicht passt; leer = passt. Reihenfolge: enthält, Spuren, Tags. */
export function filterReasons(i: FilterSubject, f: MixFilter): FilterReason[] {
  const reasons: FilterReason[] = []
  const excluded = ALLERGENS.map((a) => a.id).filter((id) => f.excludedAllergens.includes(id))
  for (const allergen of excluded) {
    if (i.allergensContains.includes(allergen)) reasons.push({ kind: 'contains', allergen })
  }
  if (f.excludeTraces) {
    for (const allergen of excluded) {
      if (i.allergensTraces.includes(allergen) && !i.allergensContains.includes(allergen)) {
        reasons.push({ kind: 'traces', allergen })
      }
    }
  }
  const tags = i.tags ?? []
  for (const tag of f.requiredTags) {
    if (!tags.some((t) => sameName(t, tag))) reasons.push({ kind: 'missingTag', tag })
  }
  return reasons
}

export function passesFilter(i: FilterSubject, f: MixFilter): boolean {
  return filterReasons(i, f).length === 0
}

/** „enthält Schalenfrüchte“, „Spuren: Sesam“, „nicht „vegan““. */
export function reasonLabel(r: FilterReason): string {
  switch (r.kind) {
    case 'contains':
      return `enthält ${allergenLabel(r.allergen)}`
    case 'traces':
      return `Spuren: ${allergenLabel(r.allergen)}`
    case 'missingTag':
      return `nicht „${r.tag}“`
  }
}

/** Alle Gründe in einer Zeile, z. B. „enthält Gluten · nicht „vegan““. */
export function reasonsLine(reasons: readonly FilterReason[]): string {
  return reasons.map(reasonLabel).join(' · ')
}

export interface MixViolation {
  ingredientId: string
  name: string
  reasons: FilterReason[]
}

/**
 * Zutaten eines gespeicherten Müslis, die nicht zum Filter passen. Allergene aus dem Snapshot,
 * Tags aus der aktuellen Zutat (fehlt sie, gelten verlangte Tags als nicht erfüllt).
 */
export function mixViolations(
  items: readonly MixItem[],
  ingredients: ReadonlyMap<string, Pick<Ingredient, 'tags'>>,
  f: MixFilter,
): MixViolation[] {
  if (!isFilterActive(f)) return []
  const out: MixViolation[] = []
  for (const item of items) {
    if (item.grams <= 0) continue
    const reasons = filterReasons({ ...item.snapshot, tags: ingredients.get(item.ingredientId)?.tags }, f)
    if (reasons.length > 0) out.push({ ingredientId: item.ingredientId, name: item.snapshot.name, reasons })
  }
  return out
}

/** Chips für die aktiven Filter: „Ohne Schalenfrüchte“ …, „inkl. Spuren“, dann die Tags. */
export function filterChipLabels(f: MixFilter): string[] {
  const allergens = ALLERGENS.filter((a) => f.excludedAllergens.includes(a.id)).map((a) => `Ohne ${a.label}`)
  return [...allergens, ...(f.excludeTraces && allergens.length > 0 ? ['inkl. Spuren'] : []), ...f.requiredTags]
}

/** Allergen an- oder abwählen. */
export function toggleAllergen(f: MixFilter, id: AllergenId): MixFilter {
  const has = f.excludedAllergens.includes(id)
  return { ...f, excludedAllergens: has ? f.excludedAllergens.filter((a) => a !== id) : [...f.excludedAllergens, id] }
}

/** Tag an- oder abwählen (Groß-/Kleinschreibung egal). */
export function toggleTag(f: MixFilter, tag: string): MixFilter {
  const has = f.requiredTags.some((t) => sameName(t, tag))
  return {
    ...f,
    requiredTags: has ? f.requiredTags.filter((t) => !sameName(t, tag)) : normalizeTags([...f.requiredTags, tag]),
  }
}

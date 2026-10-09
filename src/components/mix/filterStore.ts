// Die beiden Filter (beim Mixen und bei „Meine Müslis“) leben nur im Arbeitsspeicher: Beim Wechsel der Screens
// bleiben sie, nach einem Neustart der App sind sie leer. Nach dem Speichern eines Müslis werden beide
// zurückgesetzt, beim Verwerfen der Filter beim Mixen (das nächste Müsli beginnt ohne Filter).
import { EMPTY_FILTER, type MixFilter } from '../../domain/filter'

export type FilterScope = 'mix' | 'muesli'

const filters: Record<FilterScope, MixFilter> = { mix: EMPTY_FILTER, muesli: EMPTY_FILTER }
const listeners = new Set<() => void>()

export function getFilter(scope: FilterScope): MixFilter {
  return filters[scope]
}

export function setFilter(scope: FilterScope, filter: MixFilter): void {
  filters[scope] = filter
  listeners.forEach((l) => l())
}

/** Setzt die genannten Filter zurück (ohne Angabe beide). */
export function resetFilters(scopes: readonly FilterScope[] = ['mix', 'muesli']): void {
  for (const scope of scopes) filters[scope] = EMPTY_FILTER
  listeners.forEach((l) => l())
}

/** Für useSyncExternalStore: meldet jede Änderung. Gibt die Abmeldung zurück. */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

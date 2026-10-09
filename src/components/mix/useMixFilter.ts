// Die beiden Filter, gespeichert in den Einstellungen, jeweils undefined, solange sie noch laden:
// - beim Mixen: gilt in „Zutat hinzufügen“ und für die Hinweise an den Zutatenkarten im Mixen-Screen
// - bei „Meine Müslis“: blendet unpassende Müslis aus, Hinweis im Müsli-Detail
import { useLiveQuery } from 'dexie-react-hooks'
import { DEFAULT_FILTER_KEY, MUESLI_FILTER_KEY, type FilterKey } from '../../backup/format'
import { db } from '../../db/db'
import { loadFilter, saveFilter } from '../../db/repo'
import type { Mix } from '../../db/types'
import { mixViolations, type MixFilter, type MixViolation } from '../../domain/filter'

function useStoredFilter(key: FilterKey): [MixFilter | undefined, (filter: MixFilter) => void] {
  const filter = useLiveQuery(() => loadFilter(key), [key])
  return [filter, (f) => void saveFilter(key, f)]
}

export const useMixFilter = () => useStoredFilter(DEFAULT_FILTER_KEY)
export const useMuesliFilter = () => useStoredFilter(MUESLI_FILTER_KEY)

/**
 * Prüft gespeicherte Müslis gegen den Filter bei „Meine Müslis“: Allergene aus dem Snapshot, Tags aus der
 * aktuellen Zutat. undefined, solange Filter oder Zutaten laden (damit nichts kurz falsch angezeigt wird).
 */
export function useMuesliCheck():
  | { filter: MixFilter; setFilter: (filter: MixFilter) => void; check: (mix: Mix) => MixViolation[] }
  | undefined {
  const [filter, setFilter] = useMuesliFilter()
  const ingredients = useLiveQuery(() => db.ingredients.toArray(), [])
  if (!filter || !ingredients) return undefined
  const byId = new Map(ingredients.map((i) => [i.id, i]))
  return { filter, setFilter, check: (mix) => mixViolations(mix.items, byId, filter) }
}

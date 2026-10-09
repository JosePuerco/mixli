// Die beiden Filter als React-Hooks (Inhalt siehe filterStore.ts, nur im Arbeitsspeicher):
// - beim Mixen: gilt in „Zutat hinzufügen“ und für die Hinweise an den Zutatenkarten im Mixen-Screen
// - bei „Meine Müslis“: blendet unpassende Müslis aus, Hinweis im Müsli-Detail
import { useSyncExternalStore } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import type { Mix } from '../../db/types'
import { mixViolations, type MixFilter, type MixViolation } from '../../domain/filter'
import { getFilter, setFilter, subscribe, type FilterScope } from './filterStore'

function useFilter(scope: FilterScope): [MixFilter, (filter: MixFilter) => void] {
  const filter = useSyncExternalStore(subscribe, () => getFilter(scope))
  return [filter, (f) => setFilter(scope, f)]
}

export const useMixFilter = () => useFilter('mix')
export const useMuesliFilter = () => useFilter('muesli')

/**
 * Prüft gespeicherte Müslis gegen den Filter bei „Meine Müslis“: Allergene aus dem Snapshot, Tags aus der
 * aktuellen Zutat. undefined, solange die Zutaten laden (damit nichts kurz falsch angezeigt wird).
 */
export function useMuesliCheck():
  | { filter: MixFilter; setFilter: (filter: MixFilter) => void; check: (mix: Mix) => MixViolation[] }
  | undefined {
  const [filter, setMuesliFilter] = useMuesliFilter()
  const ingredients = useLiveQuery(() => db.ingredients.toArray(), [])
  if (!ingredients) return undefined
  const byId = new Map(ingredients.map((i) => [i.id, i]))
  return { filter, setFilter: setMuesliFilter, check: (mix) => mixViolations(mix.items, byId, filter) }
}

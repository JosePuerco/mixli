// Der Filter beim Mixen, gespeichert in den Einstellungen. Gilt in „Zutat hinzufügen“, im Mixen-Screen
// und bei den gespeicherten Müslis (Warnung). undefined, solange er noch lädt.
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import { loadFilter, saveFilter } from '../../db/repo'
import type { Mix } from '../../db/types'
import { mixViolations, type MixFilter, type MixViolation } from '../../domain/filter'

export function useMixFilter(): [MixFilter | undefined, (filter: MixFilter) => void] {
  const filter = useLiveQuery(loadFilter, [])
  return [filter, (f) => void saveFilter(f)]
}

/**
 * Prüft gespeicherte Müslis gegen den Filter: Allergene aus dem Snapshot, Tags aus der aktuellen Zutat.
 * Solange Filter oder Zutaten laden, gibt die Prüfung nichts zurück (keine Warnung, die kurz aufblitzt).
 */
export function useMixViolations(): { filter: MixFilter | undefined; check: (mix: Mix) => MixViolation[] } {
  const [filter] = useMixFilter()
  const ingredients = useLiveQuery(() => db.ingredients.toArray(), [])
  const byId = new Map((ingredients ?? []).map((i) => [i.id, i]))
  return {
    filter,
    check: (mix) => (filter && ingredients ? mixViolations(mix.items, byId, filter) : []),
  }
}

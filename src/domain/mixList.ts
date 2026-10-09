// Anzeige-Hilfen für gespeicherte Müslis (Liste und Detail): Sortierung und Textzeilen.
import type { Mix, MixItem } from '../db/types'
import { formatDate } from '../lib/format'
import { allergenLabel } from './allergens'
import type { MixAllergens } from './mix'

export type MixSort = 'newest' | 'az'

/** „Neueste“: zuletzt angelegt zuerst. „A–Z“: nach Name, deutsch sortiert. Gibt eine neue Liste zurück. */
export function sortMixes<T extends Pick<Mix, 'name' | 'createdAt'>>(list: readonly T[], sort: MixSort): T[] {
  return [...list].sort((a, b) =>
    sort === 'newest'
      ? b.createdAt.getTime() - a.createdAt.getTime() || a.name.localeCompare(b.name, 'de')
      : a.name.localeCompare(b.name, 'de') || b.createdAt.getTime() - a.createdAt.getTime(),
  )
}

/** „1 gespeichert“, „3 gespeichert“. */
export function mixCountLabel(n: number): string {
  return `${n} gespeichert`
}

/** Hinweis unter der gefilterten Liste: „1 Müsli passt nicht zum Filter und ist ausgeblendet.“ */
export function hiddenMixesLabel(n: number): string {
  return n === 1
    ? '1 Müsli passt nicht zum Filter und ist ausgeblendet.'
    : `${n} Müslis passen nicht zum Filter und sind ausgeblendet.`
}

/** „Für Lena · 07.10.2026“, ohne „für wen“ nur das Datum. */
export function mixMeta(mix: Pick<Mix, 'forWhom' | 'createdAt'>): string {
  const date = formatDate(mix.createdAt)
  return mix.forWhom ? `Für ${mix.forWhom} · ${date}` : date
}

/** „Haferflocken, Mandeln, Rosinen“ in der Reihenfolge des Mixes. */
export function ingredientNames(items: readonly Pick<MixItem, 'snapshot'>[]): string {
  return items.map((i) => i.snapshot.name).join(', ')
}

/** „Gluten · Schalenfrüchte · Spuren: Milch, Sesam“; ohne Allergene „Keine Allergene“. */
export function allergenSummary({ contains, traces }: MixAllergens): string {
  const parts = contains.map(allergenLabel)
  if (traces.length > 0) parts.push(`Spuren: ${traces.map(allergenLabel).join(', ')}`)
  return parts.length > 0 ? parts.join(' · ') : 'Keine Allergene'
}

// Hinweis, dass ein gespeichertes Müsli nicht zum Filter beim Mixen passt (Warnfarbe aus den Tokens).
// Kurz in der Müsli-Liste, ausführlich mit Zutaten und Gründen im Müsli-Detail.
import type { MixFilter, MixViolation } from '../../domain/filter'
import { filterChipLabels, reasonsLine } from '../../domain/filter'

const dot = <span className="size-2 shrink-0 rounded-pill bg-warning-dot" aria-hidden="true" />

/** Eine Zeile für die Karte in der Liste. */
export function FilterWarningLine() {
  return (
    <span className="inline-flex items-center gap-1.5 self-start rounded-pill bg-warning-bg px-2.5 py-1 text-caption font-semibold">
      {dot}
      Passt nicht zum Filter
    </span>
  )
}

/** Karte im Detail: welcher Filter gilt und welche Zutaten warum nicht passen. */
export function FilterWarningCard({ filter, violations }: { filter: MixFilter; violations: readonly MixViolation[] }) {
  return (
    <section className="flex flex-col gap-gap-sm rounded-card bg-warning-bg p-gap-lg" aria-label="Filter-Hinweis">
      <h2 className="flex items-center gap-2 text-body font-bold">
        {dot}
        Passt nicht zum Filter
      </h2>
      <ul className="flex flex-col gap-1">
        {violations.map((v) => (
          <li key={v.ingredientId} className="text-sm font-medium">
            <span className="font-bold">{v.name}:</span> {reasonsLine(v.reasons)}
          </li>
        ))}
      </ul>
      <p className="text-caption text-text-muted">Filter beim Mixen: {filterChipLabels(filter).join(', ')}</p>
    </section>
  )
}

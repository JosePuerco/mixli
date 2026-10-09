// Ansicht „Filter“ im Sheet „Zutat hinzufügen“: Allergene ausschließen, Schalter „Spuren auch ausschließen“,
// Tags verlangen. Jede Änderung wird sofort gespeichert.
import { useId } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { listTags } from '../../db/repo'
import { ALLERGENS } from '../../domain/allergens'
import { isFilterActive, toggleAllergen, toggleTag, EMPTY_FILTER, type MixFilter } from '../../domain/filter'
import { DEFAULT_TAGS, mergeTags, sameName } from '../../domain/ingredient'
import { Button } from '../ui/Button'
import { ChoiceChip } from '../ui/Chip'
import { Switch } from '../ui/Switch'

interface FilterPanelProps {
  filter: MixFilter
  onChange: (filter: MixFilter) => void
}

export function FilterPanel({ filter, onChange }: FilterPanelProps) {
  const storedTags = useLiveQuery(listTags, [], [...DEFAULT_TAGS])
  // Verlangte Tags bleiben sichtbar, auch wenn gerade keine Zutat sie hat (sonst ließen sie sich nicht abwählen).
  const allTags = mergeTags([...storedTags, ...filter.requiredTags])
  const allergensHeadingId = useId()
  const tagsHeadingId = useId()

  return (
    <div className="flex flex-col gap-4.5">
      <section className="flex flex-col gap-2.5" aria-labelledby={allergensHeadingId}>
        <h3 id={allergensHeadingId} className="px-1 text-label">
          Allergene ausschließen
        </h3>
        <div className="flex flex-wrap gap-gap-sm">
          {ALLERGENS.map((a) => (
            <ChoiceChip
              key={a.id}
              outlined
              selected={filter.excludedAllergens.includes(a.id)}
              onClick={() => onChange(toggleAllergen(filter, a.id))}
            >
              {a.label}
            </ChoiceChip>
          ))}
        </div>
        <div className="px-1">
          <Switch
            label="Spuren auch ausschließen"
            hint="Auch Zutaten, die Spuren davon enthalten können"
            checked={filter.excludeTraces}
            onChange={(excludeTraces) => onChange({ ...filter, excludeTraces })}
          />
        </div>
      </section>

      <section className="flex flex-col gap-2.5" aria-labelledby={tagsHeadingId}>
        <h3 id={tagsHeadingId} className="px-1 text-label">
          Nur Zutaten mit
        </h3>
        <div className="flex flex-wrap gap-gap-sm">
          {allTags.map((tag) => (
            <ChoiceChip
              key={tag}
              outlined
              tone="accent"
              selected={filter.requiredTags.some((t) => sameName(t, tag))}
              onClick={() => onChange(toggleTag(filter, tag))}
            >
              {tag}
            </ChoiceChip>
          ))}
        </div>
      </section>

      <Button
        variant="muted"
        size="sm"
        className="self-start"
        disabled={!isFilterActive(filter) && !filter.excludeTraces}
        onClick={() => onChange(EMPTY_FILTER)}
      >
        Zurücksetzen
      </Button>
    </div>
  )
}

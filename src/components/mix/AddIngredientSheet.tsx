// Sheet „Zutat hinzufügen“: oben die Filter-Chips, darunter die Liste mit Foto, Name, Allergen-Zeile, kcal und
// Plus. Antippen fügt die Zutat mit 50 g hinzu und schließt das Sheet. Zutaten, die nicht zum Filter passen,
// blenden auf 35 % ab und sind nicht wählbar. „Filter“ wechselt im selben Sheet zur Filter-Ansicht.
import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import type { Ingredient } from '../../db/types'
import { press } from '../../design/motion'
import { filterReasons, reasonsLine, type MixFilter } from '../../domain/filter'
import { allergenLine } from '../../domain/ingredient'
import { formatWithUnit } from '../../lib/format'
import { IconPlus } from '../icons/Icons'
import { IngredientPhoto } from '../ingredient/IngredientCard'
import { BottomSheet } from '../ui/BottomSheet'
import { Button } from '../ui/Button'
import { FilterChipRow, FilterPanel } from './FilterPanel'

interface AddIngredientSheetProps {
  open: boolean
  onClose: () => void
  /** Wählbare Zutaten: aktiv und noch nicht im Mix, sortiert. */
  available: readonly Ingredient[]
  /** Gibt es überhaupt aktive Zutaten? Sonst Hinweis auf „Zutat anlegen“. */
  hasIngredients: boolean
  filter: MixFilter
  onFilterChange: (filter: MixFilter) => void
  onAdd: (ingredientId: string) => void
  onCreateIngredient: () => void
}

export function AddIngredientSheet({
  open,
  onClose,
  available,
  hasIngredients,
  filter,
  onFilterChange,
  onAdd,
  onCreateIngredient,
}: AddIngredientSheetProps) {
  const [view, setView] = useState<'list' | 'filter'>('list')
  // Bei „Bewegung reduzieren“ grauen Zeilen sofort aus (MotionConfig schaltet nur Bewegungen ab, kein Blenden).
  const reduceMotion = useReducedMotion()
  // Beim Öffnen immer mit der Liste beginnen.
  useEffect(() => {
    if (open) setView('list')
  }, [open])

  const rows = available.map((i) => ({ ingredient: i, reasons: filterReasons(i, filter) }))
  const allBlocked = rows.length > 0 && rows.every((r) => r.reasons.length > 0)

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={view === 'filter' ? 'Filter' : 'Zutat hinzufügen'}
      headerAction={
        view === 'filter' ? (
          <Button variant="muted" size="xs" onClick={() => setView('list')}>
            Fertig
          </Button>
        ) : (
          <Button variant="muted" size="xs" onClick={onClose}>
            Fertig
          </Button>
        )
      }
    >
      {view === 'filter' ? (
        <FilterPanel target="ingredients" filter={filter} onChange={onFilterChange} />
      ) : (
        <>
          {hasIngredients && (
            <FilterChipRow outlined filter={filter} onOpen={() => setView('filter')} />
          )}
          {rows.length > 0 ? (
            <>
              {allBlocked && (
                <p className="px-1 text-caption text-text-muted">Keine Zutat passt zum Filter.</p>
              )}
              <ul className="flex flex-col gap-gap-sm">
                {rows.map(({ ingredient: i, reasons }) => {
                  const blocked = reasons.length > 0
                  return (
                    <li key={i.id}>
                      <motion.button
                        type="button"
                        {...(blocked ? {} : press)}
                        disabled={blocked}
                        onClick={() => onAdd(i.id)}
                        animate={{ opacity: blocked ? 0.35 : 1 }}
                        transition={{ duration: reduceMotion ? 0 : 0.3 }}
                        className="flex w-full items-center gap-gap-md rounded-photo bg-surface-muted p-gap-sm text-left"
                      >
                        <IngredientPhoto id={i.id} photoId={i.photoId} className="size-13 shrink-0 rounded-photo" />
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="truncate text-body font-bold">{i.name}</span>
                          <span className="truncate text-caption text-text-muted">
                            {blocked ? (
                              <>
                                <span className="sr-only">Ausgeschlossen: </span>
                                {reasonsLine(reasons)}
                              </>
                            ) : (
                              allergenLine(i)
                            )}
                          </span>
                        </span>
                        <span className="shrink-0 text-caption text-text-muted">{formatWithUnit(i.nutrition.kcal, 'kcal')}</span>
                        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-pill bg-surface text-accent" aria-hidden="true">
                          <IconPlus size={18} />
                        </span>
                      </motion.button>
                    </li>
                  )
                })}
              </ul>
            </>
          ) : hasIngredients ? (
            <p className="p-gap-lg text-center text-sm font-medium text-text-muted">Alle Zutaten sind schon im Mix.</p>
          ) : (
            <div className="flex flex-col items-center gap-gap-md p-gap-lg text-center">
              <p className="text-sm font-medium text-text-muted">Du hast noch keine Zutaten angelegt.</p>
              <Button size="sm" onClick={onCreateIngredient}>
                Zutat anlegen
              </Button>
            </div>
          )}
        </>
      )}
    </BottomSheet>
  )
}

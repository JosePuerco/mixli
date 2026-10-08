// Sheet „Zutat hinzufügen“: Liste mit Foto, Name, Allergen-Zeile, kcal und Plus. Antippen fügt die Zutat
// mit 50 g hinzu und schließt das Sheet. Filter-Chips (Allergene ausschließen) kommen in Phase 5.
import { motion } from 'motion/react'
import type { Ingredient } from '../../db/types'
import { press } from '../../design/motion'
import { allergenLine } from '../../domain/ingredient'
import { formatWithUnit } from '../../lib/format'
import { IconPlus } from '../icons/Icons'
import { IngredientPhoto } from '../ingredient/IngredientCard'
import { BottomSheet } from '../ui/BottomSheet'
import { Button } from '../ui/Button'

interface AddIngredientSheetProps {
  open: boolean
  onClose: () => void
  /** Wählbare Zutaten: aktiv und noch nicht im Mix, sortiert. */
  available: readonly Ingredient[]
  /** Gibt es überhaupt aktive Zutaten? Sonst Hinweis auf „Zutat anlegen“. */
  hasIngredients: boolean
  onAdd: (ingredientId: string) => void
  onCreateIngredient: () => void
}

export function AddIngredientSheet({ open, onClose, available, hasIngredients, onAdd, onCreateIngredient }: AddIngredientSheetProps) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Zutat hinzufügen"
      headerAction={
        <Button variant="muted" size="xs" onClick={onClose}>
          Fertig
        </Button>
      }
    >
      {available.length > 0 ? (
        <ul className="flex flex-col gap-gap-sm">
          {available.map((i) => (
            <li key={i.id}>
              <motion.button
                type="button"
                {...press}
                onClick={() => onAdd(i.id)}
                className="flex w-full items-center gap-gap-md rounded-photo bg-surface-muted p-gap-sm text-left"
              >
                <IngredientPhoto id={i.id} photoId={i.photoId} className="size-13 shrink-0 rounded-photo" />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-body font-bold">{i.name}</span>
                  <span className="truncate text-caption text-text-muted">{allergenLine(i)}</span>
                </span>
                <span className="shrink-0 text-caption text-text-muted">{formatWithUnit(i.nutrition.kcal, 'kcal')}</span>
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-pill bg-surface text-accent" aria-hidden="true">
                  <IconPlus size={18} />
                </span>
              </motion.button>
            </li>
          ))}
        </ul>
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
    </BottomSheet>
  )
}

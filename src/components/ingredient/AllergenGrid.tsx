// Schritt „Allergene“: 14 Kacheln im 2er-Raster.
// Tippen schaltet um: nicht enthalten → enthält (dunkel gefüllt) → Spuren (gestrichelt) → nicht enthalten.
import { motion } from 'motion/react'
import { ALLERGENS, type AllergenId } from '../../domain/allergens'
import {
  ALLERGEN_STATE_LABEL,
  nextAllergenState,
  type AllergenState,
  type AllergenStates,
} from '../../domain/allergenState'
import { press } from '../../design/motion'

interface AllergenGridProps {
  values: AllergenStates
  onChange: (id: AllergenId, state: AllergenState) => void
}

const stateClasses: Record<AllergenState, string> = {
  none: 'border-solid border-surface bg-surface text-text-muted',
  contains: 'border-solid border-text bg-text text-surface',
  traces: 'border-dashed border-text bg-surface text-text',
}

export function AllergenGrid({ values, onChange }: AllergenGridProps) {
  return (
    <div className="grid grid-cols-2 gap-gap-sm">
      {ALLERGENS.map((a) => {
        const state = values[a.id] ?? 'none'
        return (
          <motion.button
            key={a.id}
            type="button"
            {...press}
            onClick={() => onChange(a.id, nextAllergenState(state))}
            aria-label={`${a.label}: ${ALLERGEN_STATE_LABEL[state]}`}
            className={`flex h-13 flex-col justify-center rounded-photo border-[1.5px] px-3.5 text-left transition-colors ${stateClasses[state]}`}
          >
            <span className="text-sm font-bold">{a.label}</span>
            <span className="text-caption font-semibold opacity-80">{ALLERGEN_STATE_LABEL[state]}</span>
          </motion.button>
        )
      })}
    </div>
  )
}

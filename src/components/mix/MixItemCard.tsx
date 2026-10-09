// Zutatenkarte im Mixen-Screen: Foto mit Farbpunkt (Segmentfarbe), Name, Anteil in %, Stepper.
// Stepper: graue Pille, ± ändert um 10 g, Tippen auf die Grammzahl öffnet das Mengen-Sheet.
// Passt die Zutat nicht zum Filter, steht statt des Anteils ein Hinweis mit Warnpunkt.
import { motion } from 'motion/react'
import { press } from '../../design/motion'
import { formatGrams, formatShare } from '../../domain/rounding'
import { IconMinus, IconPlus } from '../icons/Icons'
import { IngredientPhoto } from '../ingredient/IngredientCard'
import { AnimatedNumber } from '../ui/AnimatedNumber'
import { Card } from '../ui/Card'

interface MixItemCardProps {
  ingredientId: string
  photoId?: string
  name: string
  grams: number
  share: number
  color: string
  onStep: (direction: 1 | -1) => void
  onEditAmount: () => void
  /** Warum die Zutat nicht zum Filter passt, z. B. „enthält Schalenfrüchte“. */
  warning?: string
  /** Nur für frisch hinzugefügte Zutaten: Karte ploppt herein. */
  appear?: boolean
}

const stepButton = 'inline-flex size-touch shrink-0 items-center justify-center rounded-pill text-text'

export function MixItemCard({ ingredientId, photoId, name, grams, share, color, warning, onStep, onEditAmount, appear }: MixItemCardProps) {
  const gramsText = formatGrams(grams)
  return (
    <Card padding="tight" appearIndex={appear ? 0 : undefined} className="flex min-w-0 flex-col gap-2.5">
      <div className="relative">
        <IngredientPhoto id={ingredientId} photoId={photoId} className="h-24 w-full rounded-photo" />
        <span className="absolute top-2.5 left-2.5 size-2.5 rounded-pill" style={{ backgroundColor: color }} aria-hidden="true" />
      </div>
      <div className="flex min-w-0 flex-col gap-0.5 px-1.5">
        <span className="truncate text-body">{name}</span>
        <AnimatedNumber className="text-caption text-text-muted" value={share} format={formatShare} />
        {warning && (
          <span className="flex min-w-0 items-start gap-1.5 text-caption text-text-muted">
            <span className="mt-1.25 size-2 shrink-0 rounded-pill bg-warning-dot" aria-hidden="true" />
            <span className="line-clamp-2">
              <span className="sr-only">Passt nicht zum Filter: </span>
              {warning}
            </span>
          </span>
        )}
      </div>
      {/* mt-auto: Stepper bleiben unten bündig, auch wenn eine Nachbarkarte einen Filter-Hinweis hat. */}
      <div className="mt-auto flex items-center justify-between rounded-pill bg-surface-muted">
        <motion.button type="button" {...press} className={stepButton} aria-label={`${name}: 10 g weniger`} onClick={() => onStep(-1)}>
          <IconMinus size={18} />
        </motion.button>
        <motion.button
          type="button"
          {...press}
          className="touch-extend h-9 min-w-0 rounded-pill bg-surface px-2.5 text-body font-bold"
          aria-label={`${name}: ${gramsText}, Menge genau eingeben`}
          onClick={onEditAmount}
        >
          {gramsText}
        </motion.button>
        <motion.button type="button" {...press} className={stepButton} aria-label={`${name}: 10 g mehr`} onClick={() => onStep(1)}>
          <IconPlus size={18} />
        </motion.button>
      </div>
    </Card>
  )
}

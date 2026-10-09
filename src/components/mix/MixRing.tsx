// Ring „Zusammensetzung“ nach design/DESIGN.md: Donut 120 px, Strich 12 px, Grundring in der Trennlinienfarbe,
// ein Segment je Zutat in den Segmentfarben, 3 px Lücke. Segmente gleiten bei Mengenänderungen (550 ms).
import { motion } from 'motion/react'
import { ease } from '../../design/motion'
import { ms, segmentColors, tokens } from '../../design/tokens'
import { formatGrams } from '../../domain/rounding'
import { AnimatedNumber } from '../ui/AnimatedNumber'

const SIZE = 120
const STROKE = 12
const RADIUS = 52
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const GAP = 3

const transition = { duration: ms(tokens.motion.ringSegments.durationMs), ease: ease.out }

/** Farbe für die Zutat an Position index (Ring, Punkt auf der Karte, später Balken in der Liste). */
export function segmentColor(index: number): string {
  return segmentColors[index % segmentColors.length]
}

interface MixRingProps {
  /** Anteile 0–1 in der Reihenfolge des Mixes. */
  shares: readonly number[]
  /** Stabile Schlüssel je Segment (ingredientId), damit Segmente beim Ändern gleiten statt neu zu entstehen. */
  keys: readonly string[]
  total: number
}

export function MixRing({ shares, keys, total }: MixRingProps) {
  // Bei nur einem Segment keine Lücke, sonst sähe der volle Ring angeschnitten aus.
  const gap = shares.length > 1 ? GAP : 0
  let start = 0
  const segments = shares.map((share, i) => {
    const length = Math.max(0, share * CIRCUMFERENCE - gap)
    const offset = -start * CIRCUMFERENCE
    start += share
    return { key: keys[i], color: segmentColor(i), dash: `${length} ${CIRCUMFERENCE}`, offset }
  })
  const totalText = formatGrams(total)

  return (
    <div className="relative size-30 shrink-0" role="img" aria-label={`Zusammensetzung, ${totalText} gesamt`}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90" aria-hidden="true">
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" strokeWidth={STROKE} className="stroke-divider" />
        {segments.map((s) => (
          <motion.circle
            key={s.key}
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE}
            stroke={s.color}
            initial={{ strokeDasharray: `0 ${CIRCUMFERENCE}`, strokeDashoffset: s.offset }}
            animate={{ strokeDasharray: s.dash, strokeDashoffset: s.offset }}
            transition={transition}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
        <AnimatedNumber className="text-2xl font-extrabold" value={total} format={formatGrams} step={1} />
        <span className="text-caption text-text-muted">gesamt</span>
      </div>
    </div>
  )
}

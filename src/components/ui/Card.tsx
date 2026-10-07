// Karten nach design/DESIGN.md: weiß, Radius 24, kein Schatten, kein Rahmen.
// Innenabstände aus den Prototypen: normal 16 px, Listen 4 × 16 px (Zeilen bringen eigene Höhe mit),
// Zutatenkarten 8 px (Foto fast randlos).
import type { ReactNode } from 'react'
import { motion, useReducedMotion, type HTMLMotionProps } from 'motion/react'
import { cardIn } from '../../design/motion'

type CardPadding = 'normal' | 'list' | 'tight' | 'none'

const paddingClasses: Record<CardPadding, string> = {
  normal: 'p-gap-lg',
  list: 'px-gap-lg py-1',
  tight: 'p-gap-sm pb-gap-md',
  none: '',
}

interface CardProps extends HTMLMotionProps<'div'> {
  padding?: CardPadding
  /**
   * Position in einer Liste: Die Karte ploppt beim Erscheinen mit Federeffekt rein,
   * gestaffelt um 70 ms je Position. Ohne Angabe erscheint sie ohne Animation.
   * Nur für Karten verwenden, die wirklich neu dazukommen – nicht bei jedem Tab-Wechsel
   * (Screens werden beim Wechsel neu aufgebaut, die Animation würde sonst jedes Mal laufen).
   */
  appearIndex?: number
}

export function Card({ padding = 'normal', appearIndex, className = '', ...rest }: CardProps) {
  // Bei „Bewegung reduzieren“ erscheint die Karte sofort (MotionConfig würde nur die Bewegung abschalten, nicht das Einblenden).
  const reduceMotion = useReducedMotion()
  const appear = appearIndex === undefined || reduceMotion ? {} : cardIn(appearIndex)
  return <motion.div {...appear} className={`rounded-card bg-surface ${paddingClasses[padding]} ${className}`} {...rest} />
}

interface CardTitleProps {
  children: ReactNode
  /** Zusatz rechts, z. B. „5 Kategorien“ oder „pro 100 g“. */
  aside?: ReactNode
}

/** Kopfzeile einer Karte, z. B. „Backup“ oder „Nährwerte“ (15/700). */
export function CardTitle({ children, aside }: CardTitleProps) {
  return (
    <div className="flex items-baseline justify-between gap-gap-md">
      <h2 className="text-body font-bold">{children}</h2>
      {aside && <span className="text-caption text-text-muted">{aside}</span>}
    </div>
  )
}

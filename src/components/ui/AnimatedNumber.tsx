// Zahl, die bei Änderungen zum neuen Wert zählt (480 ms, easeOutCubic, design/DESIGN.md „Motion“).
// Jeder Zwischenwert läuft durch dieselbe Formatierung wie der Endwert, ist also schon gerundet.
// Beim ersten Anzeigen und bei „Bewegung reduzieren“ steht der Wert sofort da.
// Screenreader lesen nur den Endwert, nicht die Zwischenstände.
import { useEffect, useState } from 'react'
import { animate, useMotionValue, useMotionValueEvent, useReducedMotion } from 'motion/react'
import { numberCount } from '../../design/motion'
import { countValue } from '../../lib/countUp'

interface AnimatedNumberProps {
  value: number
  format: (value: number) => string
  /** Unterwegs auf diesen Schritt runden (z. B. 1 für ganze Gramm), am Ziel exakt. */
  step?: number
  className?: string
}

export function AnimatedNumber({ value, format, step, className }: AnimatedNumberProps) {
  const reduceMotion = useReducedMotion()
  const current = useMotionValue(value)
  const [shown, setShown] = useState(value)
  useMotionValueEvent(current, 'change', setShown)

  useEffect(() => {
    if (reduceMotion) {
      current.jump(value)
      return
    }
    const controls = animate(current, value, numberCount)
    return () => controls.stop()
  }, [current, value, reduceMotion])

  const finalText = format(value)
  return (
    <span className={className}>
      <span aria-hidden="true">{reduceMotion ? finalText : format(countValue(shown, value, step))}</span>
      <span className="sr-only">{finalText}</span>
    </span>
  )
}

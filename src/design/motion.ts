// Wiederverwendbare Motion-Einstellungen nach design/DESIGN.md („Motion“).
import type { Transition } from 'motion/react'
import { ms, tokens } from './tokens'

type Bezier = [number, number, number, number]

/** "cubic-bezier(.2, .9, .3, 1.2)" → [0.2, 0.9, 0.3, 1.2] für Motion. */
export function bezier(css: string): Bezier {
  const values = css.match(/-?[\d.]+/g)?.map(Number)
  if (values?.length !== 4) throw new Error(`Ungültige cubic-bezier-Angabe: ${css}`)
  return values as Bezier
}

export const ease = {
  out: bezier(tokens.motion.easeOut),
  spring: bezier(tokens.motion.spring),
  springStrong: bezier(tokens.motion.springStrong),
}

/** Weiche Feder für Positions- und Größenwechsel (z. B. aktive Pille der Navigation). */
export const softSpring: Transition = { type: 'spring', stiffness: 420, damping: 34, mass: 0.9 }

/** Button gedrückt: gibt nach (Skalierung .92, 150 ms). */
export const press = {
  whileTap: { scale: tokens.motion.press.scale },
  transition: { duration: ms(tokens.motion.press.durationMs) },
} as const

/** Karte erscheint: ploppt mit Federeffekt rein (.85 → 1, leicht von unten), gestaffelt um 70 ms. */
export function cardIn(index = 0) {
  const { durationMs, staggerMs } = tokens.motion.cardIn
  return {
    initial: { opacity: 0, scale: 0.85, y: 12 },
    animate: { opacity: 1, scale: 1, y: 0 },
    transition: { duration: ms(durationMs), ease: ease.spring, delay: ms(staggerMs * index) },
  } as const
}

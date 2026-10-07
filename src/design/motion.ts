// Wiederverwendbare Motion-Einstellungen nach design/DESIGN.md („Motion“).
import type { Transition } from 'motion/react'
import { ms, tokens } from './tokens'

/** Weiche Feder für Positions- und Größenwechsel (z. B. aktive Pille der Navigation). */
export const softSpring: Transition = { type: 'spring', stiffness: 420, damping: 34, mass: 0.9 }

/** Button gedrückt: gibt nach (Skalierung .92, 150 ms). */
export const press = {
  whileTap: { scale: tokens.motion.press.scale },
  transition: { duration: ms(tokens.motion.press.durationMs) },
} as const

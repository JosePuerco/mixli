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
  /** easeOutCubic (tokens.motion.numberCount.easing) als Bezier-Kurve. */
  outCubic: [0.33, 1, 0.68, 1] as Bezier,
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

/**
 * Allergen-Chip kommt dazu: springt kurz auf (.6 → 1,08 → 1), 350 ms.
 * Skalierung und Deckkraft brauchen getrennte Übergänge: Die Zeitpunkte (times) gelten
 * nur für die drei Skalierungswerte. Gemeinsam angewendet ließen sie die Deckkraft
 * zwischendurch auf 0 fallen – der Chip „blinkte“ dann rein statt aufzuspringen.
 * Der Überschwinger kommt allein aus dem Zwischenwert, die Kurven selbst schwingen nicht über.
 */
export function chipIn() {
  const { durationMs, overshoot } = tokens.motion.chipIn
  return {
    initial: { opacity: 0, scale: 0.6 },
    animate: { opacity: 1, scale: [0.6, overshoot, 1] },
    transition: {
      scale: { duration: ms(durationMs), times: [0, 0.7, 1], ease: [ease.out, 'easeInOut' as const] },
      opacity: { duration: ms(durationMs) * 0.4, ease: 'easeOut' as const },
    },
  }
}

/** Zahl zählt zum neuen Wert (480 ms, easeOutCubic). */
export const numberCount = { duration: ms(tokens.motion.numberCount.durationMs), ease: ease.outCubic } as const

/** Sheet: fährt von unten hoch (420 ms), schließt etwas schneller. */
export const sheetTransition = {
  enter: { duration: ms(tokens.motion.sheetIn.durationMs), ease: ease.out },
  exit: { duration: ms(tokens.motion.sheetIn.durationMs) * 0.7, ease: ease.out },
} as const

/** Overlay hinter dem Sheet: blendet in 250 ms ein. */
export const overlayTransition = { duration: ms(tokens.motion.overlayIn.durationMs), ease: 'easeOut' } as const

/**
 * Schritt im Ablauf wechselt: Inhalt gleitet 28 px herein (380 ms).
 * Vorwärts von rechts, zurück von links – so bleibt die Richtung erkennbar.
 */
export function stepIn(direction: 1 | -1 = 1) {
  const { durationMs } = tokens.motion.stepIn
  return {
    initial: { opacity: 0, x: 28 * direction },
    animate: { opacity: 1, x: 0 },
    transition: { duration: ms(durationMs), ease: ease.out },
  } as const
}

/** Ganzseitige Abläufe (Zutat anlegen/bearbeiten, Müsli-Detail) liegen eine Ebene unter den Tabs. */
const FLOW_PATH = /^\/(zutaten|muesli)\/.+/

export function isFlowPath(pathname: string): boolean {
  return FLOW_PATH.test(pathname)
}

/** Art des Screen-Wechsels: zwischen Tabs überblenden, in ein Detail hinein vorwärts, heraus zurück. */
export type ScreenChange = 'fade' | 'forward' | 'back'

export function screenChange(from: string, to: string): ScreenChange {
  const depth = (p: string) => (isFlowPath(p) ? 1 : 0)
  const d = depth(to) - depth(from)
  return d > 0 ? 'forward' : d < 0 ? 'back' : 'fade'
}

/**
 * Screen-Wechsel: Der neue Screen legt sich über den alten und blendet ein (Tabs, 200 ms)
 * bzw. gleitet wie ein Schritt herein (Detail, 28 px, 380 ms; zurück von links).
 * Der alte Screen bleibt undurchsichtig darunter stehen, bis der neue ganz da ist –
 * so mischen sich nie zwei halbdurchsichtige Screens.
 */
export function screenIn(change: ScreenChange) {
  const fade = ms(tokens.motion.screenFade.durationMs)
  const slide = ms(tokens.motion.stepIn.durationMs)
  const duration = change === 'fade' ? fade : slide
  const x = change === 'fade' ? 0 : change === 'forward' ? 28 : -28
  return {
    initial: { opacity: 0, x, zIndex: 1 },
    animate: { opacity: 1, x: 0, zIndex: 1, transition: { duration, ease: ease.out, zIndex: { duration: 0 } } },
    // Alter Screen: sofort nach unten, verschwindet erst, wenn der neue fertig ist (längster Fall).
    exit: {
      zIndex: 0,
      opacity: 0,
      transition: { zIndex: { duration: 0 }, opacity: { duration: 0, delay: Math.max(fade, slide) } },
    },
  }
}

/** Navigation blendet beim Öffnen/Schließen eines Details aus und ein (200 ms). */
export const navFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: ms(tokens.motion.screenFade.durationMs), ease: 'easeOut' },
} as const

/**
 * Karte verlässt ein Raster (z. B. Zutat bei 0 g): blendet aus und wird etwas kleiner (250 ms),
 * die übrigen Karten gleiten mit weicher Feder an ihren neuen Platz (layout).
 */
export const cardOut = {
  exit: { opacity: 0, scale: 0.85, transition: { duration: 0.25, ease: ease.out } },
} as const

/** Bestätigung (z. B. Häkchen „Foto übernommen“): ploppt mit kräftiger Feder auf (.85 → 1,04 → 1). */
export function popIn() {
  return {
    initial: { opacity: 0, scale: 0.85 },
    animate: { opacity: 1, scale: [0.85, 1.04, 1] },
    exit: { opacity: 0, scale: 0.9 },
    transition: {
      scale: { duration: 0.4, times: [0, 0.7, 1], ease: [ease.out, 'easeInOut' as const] },
      opacity: { duration: 0.16 },
    },
  }
}

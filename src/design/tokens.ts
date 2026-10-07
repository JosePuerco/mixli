// Design-Tokens für JavaScript (z. B. Motion-Dauern, Ringfarben).
// Quelle ist design/tokens.json – hier nichts doppelt pflegen.
import tokens from '../../design/tokens.json'

export { tokens }

export const segmentColors: readonly string[] = tokens.color.segments
export const photoPlaceholderColors: readonly string[] = tokens.color.photoPlaceholders

/** Millisekunden in Sekunden (Motion erwartet Sekunden). */
export const ms = (value: number) => value / 1000

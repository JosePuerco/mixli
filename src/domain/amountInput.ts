// Eingabe im Mengen-Sheet über den eigenen Ziffernblock: höchstens 4 Vorkommastellen und
// 1 Nachkommastelle, Dezimalkomma. Reine Funktionen, damit das Tippverhalten getestet werden kann.
import { normalizeGrams } from './mix'

export type AmountKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | ',' | 'del'

export interface AmountInput {
  /** So wie getippt, z. B. „12,“ oder „250“. Leer heißt 0. */
  text: string
  /**
   * Wert ist vorgegeben (beim Öffnen oder per Schnellwert): Die nächste Ziffer ersetzt ihn,
   * statt angehängt zu werden – wie ein markierter Wert in einem Eingabefeld.
   */
  fresh: boolean
}

/** Startwert: die aktuelle Menge, z. B. 50 → „50“, 12,5 → „12,5“. */
export function amountInput(grams: number): AmountInput {
  const g = normalizeGrams(grams)
  return { text: String(g).replace('.', ','), fresh: true }
}

export function pressKey(input: AmountInput, key: AmountKey): AmountInput {
  if (key === 'del') return { text: input.text.slice(0, -1), fresh: false }

  const text = input.fresh ? '' : input.text
  const [whole, decimals] = text.split(',')

  if (key === ',') {
    if (decimals !== undefined) return { ...input, fresh: false }
    return { text: `${whole || '0'},`, fresh: false }
  }
  if (decimals !== undefined) {
    return decimals.length >= 1 ? { ...input, fresh: false, text } : { text: text + key, fresh: false }
  }
  // Keine führenden Nullen: „0“ und dann „7“ ergibt „7“.
  if (whole === '0') return { text: key, fresh: false }
  if (whole.length >= 4) return { text, fresh: false }
  return { text: whole + key, fresh: false }
}

/** Anzeige der großen Zahl: leer als „0“. */
export function amountDisplay(input: AmountInput): string {
  return input.text === '' ? '0' : input.text
}

/** Getippter Text als Gramm (auf 0,1 g). „12,“ ergibt 12, leer ergibt 0. */
export function amountToGrams(input: AmountInput): number {
  const n = Number(input.text.replace(',', '.') || '0')
  return normalizeGrams(n)
}

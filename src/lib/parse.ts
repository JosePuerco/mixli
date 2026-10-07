// Zahleneingaben aus Formularen: Komma und Punkt sind beide erlaubt („13,5“ wie auf der Packung).

const DECIMAL = /^-?(\d+([.,]\d*)?|[.,]\d+)$/

/**
 * Liest eine Dezimalzahl aus einer Eingabe.
 * Leere Eingabe → undefined, ungültige Eingabe → NaN.
 */
export function parseDecimal(input: string): number | undefined {
  const s = input.trim()
  if (s === '') return undefined
  if (!DECIMAL.test(s)) return Number.NaN
  return Number(s.replace(',', '.'))
}

/** Zahl zurück in ein Eingabefeld schreiben, ungerundet und mit Komma (zum Bearbeiten). */
export function toDecimalInput(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) return ''
  return String(value).replace('.', ',')
}

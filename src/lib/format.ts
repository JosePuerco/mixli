// Zahlen für die Anzeige: deutsches Dezimalkomma, keine Tausenderpunkte (wie auf Etiketten: „1669 kJ“).
// Einheiten werden mit geschütztem Leerzeichen angehängt, damit „14 g“ nie umbricht.

export const NBSP = ' '

const formatters = new Map<number, Intl.NumberFormat>()

function formatter(decimals: number): Intl.NumberFormat {
  let f = formatters.get(decimals)
  if (!f) {
    f = new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: false,
    })
    formatters.set(decimals, f)
  }
  return f
}

/** Formatiert eine Zahl mit fester Anzahl Nachkommastellen und Dezimalkomma. */
export function formatNumber(value: number, decimals = 0): string {
  return formatter(decimals).format(value)
}

/** Formatiert eine Zahl mit Einheit, z. B. formatWithUnit(14, 'g') → „14 g“. */
export function formatWithUnit(value: number, unit: string, decimals = 0): string {
  return `${formatNumber(value, decimals)}${NBSP}${unit}`
}

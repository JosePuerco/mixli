// Zwischenwerte für hochzählende Zahlen (design/DESIGN.md „Motion“: Zahlen zählen zum neuen Wert).

/**
 * Wert, der während des Zählens angezeigt wird. Unterwegs wird auf `step` gerundet,
 * damit z. B. „312 g“ nicht zwischen „312,4 g“ und „313 g“ flackert und die Breite springt.
 * Am Ziel steht immer der exakte Zielwert (12,5 g bleibt 12,5 g).
 */
export function countValue(current: number, target: number, step?: number): number {
  if (Math.abs(current - target) < 1e-9) return target
  if (!step) return current
  return Math.round(current / step) * step
}

// Maße von Etikett und A4-Etikettenbogen (3 × 7 = 21 Etiketten) an einer Stelle.
// Passen die Bögen eines Herstellers nicht genau, hier anpassen – Vorschau, Druck und PDF folgen.

/** Ein Etikett in Millimetern. */
export const LABEL_WIDTH_MM = 70
export const LABEL_HEIGHT_MM = 42.3

export const PAGE_WIDTH_MM = 210
export const PAGE_HEIGHT_MM = 297
export const SHEET_COLUMNS = 3
export const SHEET_ROWS = 7
export const LABELS_PER_SHEET = SHEET_COLUMNS * SHEET_ROWS

/**
 * Rand des Bogens. Standard: seitlich randlos (3 × 70 = 210 mm), oben und unten der Rest
 * zu gleichen Teilen ((297 − 7 × 42,3) ÷ 2 = 0,45 mm). Abstände zwischen den Etiketten gibt es keine.
 */
export const SHEET_MARGIN_TOP_MM = (PAGE_HEIGHT_MM - SHEET_ROWS * LABEL_HEIGHT_MM) / 2
export const SHEET_MARGIN_LEFT_MM = (PAGE_WIDTH_MM - SHEET_COLUMNS * LABEL_WIDTH_MM) / 2

export interface LabelPosition {
  /** Linke obere Ecke in mm, gemessen von der linken oberen Ecke des Bogens. */
  x: number
  y: number
}

/** Positionen aller 21 Etiketten, zeilenweise von links oben nach rechts unten. */
export function sheetPositions(): LabelPosition[] {
  const round = (mm: number) => Math.round(mm * 1000) / 1000
  return Array.from({ length: LABELS_PER_SHEET }, (_, i) => ({
    x: round(SHEET_MARGIN_LEFT_MM + (i % SHEET_COLUMNS) * LABEL_WIDTH_MM),
    y: round(SHEET_MARGIN_TOP_MM + Math.floor(i / SHEET_COLUMNS) * LABEL_HEIGHT_MM),
  }))
}

/** Druckauflösung für Bild und PDF: 600 dpi. */
export const EXPORT_DPI = 600
/** Faktor gegenüber CSS-px (96 dpi): 600 ÷ 96 = 6,25. */
export const EXPORT_PIXEL_RATIO = EXPORT_DPI / 96

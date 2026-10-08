import { describe, expect, it } from 'vitest'
import {
  LABEL_HEIGHT_MM,
  LABEL_WIDTH_MM,
  LABELS_PER_SHEET,
  PAGE_HEIGHT_MM,
  PAGE_WIDTH_MM,
  SHEET_MARGIN_LEFT_MM,
  SHEET_MARGIN_TOP_MM,
  sheetPositions,
} from './labelSheet'

describe('A4-Etikettenbogen', () => {
  it('hat 21 Etiketten, seitlich randlos, oben und unten je 0,45 mm Rand', () => {
    expect(LABELS_PER_SHEET).toBe(21)
    expect(SHEET_MARGIN_LEFT_MM).toBe(0)
    expect(SHEET_MARGIN_TOP_MM).toBeCloseTo(0.45, 10)
  })

  it('legt die Etiketten zeilenweise von links oben nach rechts unten', () => {
    const p = sheetPositions()
    expect(p).toHaveLength(21)
    expect(p.slice(0, 4)).toEqual([
      { x: 0, y: 0.45 },
      { x: 70, y: 0.45 },
      { x: 140, y: 0.45 },
      { x: 0, y: 42.75 },
    ])
    expect(p[20]).toEqual({ x: 140, y: 254.25 })
  })

  it('bleibt vollständig auf der Seite', () => {
    for (const { x, y } of sheetPositions()) {
      expect(x + LABEL_WIDTH_MM).toBeLessThanOrEqual(PAGE_WIDTH_MM)
      expect(y + LABEL_HEIGHT_MM).toBeLessThanOrEqual(PAGE_HEIGHT_MM)
    }
  })
})

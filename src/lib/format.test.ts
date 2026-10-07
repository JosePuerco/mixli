import { describe, expect, it } from 'vitest'
import { NBSP, formatNumber, formatWithUnit } from './format'

describe('formatNumber', () => {
  it('nutzt das Dezimalkomma', () => {
    expect(formatNumber(1.6, 1)).toBe('1,6')
    expect(formatNumber(0.02, 2)).toBe('0,02')
  })

  it('setzt keine Tausenderpunkte', () => {
    expect(formatNumber(1669)).toBe('1669')
  })

  it('rundet auf die gewünschten Nachkommastellen', () => {
    expect(formatNumber(13.7)).toBe('14')
    expect(formatNumber(7.84, 1)).toBe('7,8')
  })

  it('füllt fehlende Nachkommastellen auf', () => {
    expect(formatNumber(2, 1)).toBe('2,0')
  })
})

describe('formatWithUnit', () => {
  it('trennt Zahl und Einheit mit geschütztem Leerzeichen', () => {
    expect(formatWithUnit(14, 'g')).toBe(`14${NBSP}g`)
    expect(formatWithUnit(399, 'kcal')).toBe(`399${NBSP}kcal`)
  })
})

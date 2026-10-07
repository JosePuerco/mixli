import { describe, expect, it } from 'vitest'
import { parseDecimal, toDecimalInput } from './parse'

describe('parseDecimal', () => {
  it('versteht Komma und Punkt', () => {
    expect(parseDecimal('13,5')).toBe(13.5)
    expect(parseDecimal('13.5')).toBe(13.5)
    expect(parseDecimal(',5')).toBe(0.5)
    expect(parseDecimal('7,')).toBe(7)
  })

  it('ignoriert Leerzeichen am Rand', () => {
    expect(parseDecimal('  372 ')).toBe(372)
  })

  it('gibt bei leerer Eingabe undefined zurück', () => {
    expect(parseDecimal('')).toBeUndefined()
    expect(parseDecimal('   ')).toBeUndefined()
  })

  it('gibt bei ungültiger Eingabe NaN zurück', () => {
    expect(parseDecimal('abc')).toBeNaN()
    expect(parseDecimal('1,2,3')).toBeNaN()
    expect(parseDecimal('1.234,5')).toBeNaN()
    expect(parseDecimal(',')).toBeNaN()
    expect(parseDecimal('12 g')).toBeNaN()
  })
})

describe('toDecimalInput', () => {
  it('schreibt mit Komma und ohne Rundung', () => {
    expect(toDecimalInput(13.5)).toBe('13,5')
    expect(toDecimalInput(1556.448)).toBe('1556,448')
    expect(toDecimalInput(0)).toBe('0')
  })

  it('gibt bei fehlendem Wert einen leeren Text zurück', () => {
    expect(toDecimalInput(undefined)).toBe('')
    expect(toDecimalInput(Number.NaN)).toBe('')
  })
})

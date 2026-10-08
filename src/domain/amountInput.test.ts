import { describe, expect, it } from 'vitest'
import { amountDisplay, amountInput, amountToGrams, pressKey, type AmountInput, type AmountKey } from './amountInput'

/** Tippt mehrere Tasten nacheinander. */
const type = (input: AmountInput, ...keys: AmountKey[]) => keys.reduce(pressKey, input)
const blank: AmountInput = { text: '', fresh: false }

describe('amountInput', () => {
  it('zeigt die aktuelle Menge mit Dezimalkomma', () => {
    expect(amountInput(50)).toEqual({ text: '50', fresh: true })
    expect(amountInput(12.5)).toEqual({ text: '12,5', fresh: true })
    expect(amountInput(0.1 + 0.2)).toEqual({ text: '0,3', fresh: true })
  })
})

describe('pressKey', () => {
  it('ersetzt den vorgegebenen Wert mit der ersten Ziffer', () => {
    expect(type(amountInput(50), '7').text).toBe('7')
    expect(type(amountInput(50), '7', '5').text).toBe('75')
  })

  it('beginnt mit „0,“, wenn zuerst das Komma kommt', () => {
    expect(type(amountInput(50), ',', '5').text).toBe('0,5')
    expect(type(blank, ',').text).toBe('0,')
  })

  it('löscht mit ⌫ die letzte Stelle, auch beim vorgegebenen Wert', () => {
    expect(type(amountInput(50), 'del').text).toBe('5')
    expect(type(amountInput(50), 'del', '2').text).toBe('52')
    expect(type(amountInput(5), 'del', 'del').text).toBe('')
  })

  it('erlaubt höchstens 4 Vorkommastellen', () => {
    expect(type(blank, '1', '2', '3', '4', '5').text).toBe('1234')
  })

  it('erlaubt höchstens 1 Nachkommastelle', () => {
    expect(type(blank, '1', '2', ',', '3', '4').text).toBe('12,3')
    expect(type(blank, '1', '2', '3', '4', ',', '5').text).toBe('1234,5')
  })

  it('nimmt das Komma nur einmal', () => {
    expect(type(blank, '1', ',', ',', '5').text).toBe('1,5')
  })

  it('setzt keine führenden Nullen', () => {
    expect(type(blank, '0', '0', '7').text).toBe('7')
    expect(type(blank, '0', ',', '5').text).toBe('0,5')
  })

  it('ist nach jeder Taste nicht mehr „vorgegeben“', () => {
    expect(pressKey(amountInput(50), '1').fresh).toBe(false)
    expect(pressKey(amountInput(50), 'del').fresh).toBe(false)
  })
})

describe('amountDisplay', () => {
  it('zeigt leer als „0“', () => {
    expect(amountDisplay(blank)).toBe('0')
    expect(amountDisplay({ text: '12,', fresh: false })).toBe('12,')
  })
})

describe('amountToGrams', () => {
  it('liest den Text als Gramm', () => {
    expect(amountToGrams({ text: '250', fresh: false })).toBe(250)
    expect(amountToGrams({ text: '12,5', fresh: false })).toBe(12.5)
    expect(amountToGrams({ text: '12,', fresh: false })).toBe(12)
    expect(amountToGrams({ text: '0,', fresh: false })).toBe(0)
  })

  it('ergibt 0 für eine leere Eingabe (die Zutat fliegt dann aus dem Mix)', () => {
    expect(amountToGrams(blank)).toBe(0)
  })
})

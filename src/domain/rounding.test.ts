import { describe, expect, it } from 'vitest'
import { NBSP } from '../lib/format'
import { clean, formatGrams, formatNutrient, formatShare, roundHalfUp, roundNutrient } from './rounding'

/** Lesbarer: Leerzeichen im Erwartungswert steht für das geschützte Leerzeichen. */
const t = (s: string) => s.replace(/ /g, NBSP)

describe('clean / roundHalfUp', () => {
  it('entfernt Gleitkomma-Rauschen', () => {
    expect(clean(0.1 + 0.2)).toBe(0.3)
  })

  it('rundet ,5 nach oben, auch wenn die Gleitkommazahl knapp darunter liegt', () => {
    expect(roundHalfUp(1.15, 1)).toBe(1.2) // 1,15 × 10 = 11,499999999999998
    expect(roundHalfUp(1.005, 2)).toBe(1.01)
    expect(roundHalfUp(0.125, 2)).toBe(0.13)
    expect(roundHalfUp(2.5, 0)).toBe(3)
  })

  it('rundet unter ,5 ab', () => {
    expect(roundHalfUp(1.14, 1)).toBe(1.1)
    expect(roundHalfUp(13.49, 0)).toBe(13)
  })
})

describe('Energie (kJ, kcal): ganzzahlig', () => {
  it.each([
    ['kcal', 399.4, '399 kcal'],
    ['kcal', 399.5, '400 kcal'],
    ['kJ', 1669.49, '1669 kJ'],
    ['kcal', 0, '0 kcal'],
    ['kcal', 0.4, '0 kcal'],
  ] as const)('%s %d → „%s“', (unit, value, expected) => {
    expect(formatNutrient(unit === 'kJ' ? 'kj' : 'kcal', value)).toBe(t(expected))
  })

  it('setzt keine Tausenderpunkte', () => {
    expect(formatNutrient('kj', 1574)).toBe(t('1574 kJ'))
  })
})

describe('Fett, Kohlenhydrate, Zucker, Ballaststoffe, Eiweiß', () => {
  it.each([
    // ab 10 g ganzzahlig
    [13.675, '14 g'],
    [10, '10 g'],
    [10.49, '10 g'],
    [10.5, '11 g'],
    [58.7, '59 g'],
    [100, '100 g'],
    // knapp unter 10 g: auf 0,1 g gerundet wären es „10,0“ → als „10 g“
    [9.96, '10 g'],
    [9.95, '10 g'],
    [9.94, '9,9 g'],
    // unter 10 g auf 0,1 g, mit Nachkommastelle auch bei ganzen Zahlen
    [7.84, '7,8 g'],
    [7, '7,0 g'],
    [1.15, '1,2 g'],
    // bis 0,5 g einschließlich: „<0,5 g“
    [0.5, '<0,5 g'],
    [0.3, '<0,5 g'],
    [0, '<0,5 g'],
    // knapp darüber: normal auf 0,1 g
    [0.51, '0,5 g'],
    [0.55, '0,6 g'],
  ])('%d g → „%s“', (value, expected) => {
    expect(formatNutrient('protein', value)).toBe(t(expected))
  })

  it('gilt für alle fünf Felder gleich', () => {
    for (const key of ['fat', 'carbs', 'sugar', 'fiber', 'protein'] as const) {
      expect(formatNutrient(key, 0.5)).toBe(t('<0,5 g'))
      expect(formatNutrient(key, 9.96)).toBe(t('10 g'))
    }
  })

  it('erkennt 0,5 g auch mit Gleitkomma-Rauschen als „<0,5 g“', () => {
    // Gewichtetes Mittel, das rechnerisch genau 0,5 ist: (0,7 × 30 + 0,2 × 20) ÷ 50
    const v = (0.7 * 30 + 0.2 * 20) / 50
    expect(formatNutrient('sugar', v)).toBe(t('<0,5 g'))
  })
})

describe('Gesättigte Fettsäuren', () => {
  it.each([
    [12.4, '12 g'],
    [10, '10 g'],
    [9.96, '10 g'],
    [1.3, '1,3 g'],
    [0.5, '0,5 g'], // anders als Fett: 0,5 g wird normal angezeigt
    [0.15, '0,2 g'],
    [0.11, '0,1 g'],
    [0.1, '<0,1 g'],
    [0.05, '<0,1 g'],
    [0, '<0,1 g'],
  ])('%d g → „%s“', (value, expected) => {
    expect(formatNutrient('saturatedFat', value)).toBe(t(expected))
  })
})

describe('Salz', () => {
  it.each([
    // ab 1 g auf 0,1 g
    [1, '1,0 g'],
    [1.25, '1,3 g'],
    [2.04, '2,0 g'],
    // knapp unter 1 g: auf 0,01 g gerundet wären es „1,00“ → als „1,0 g“
    [0.996, '1,0 g'],
    [0.995, '1,0 g'],
    [0.994, '0,99 g'],
    // unter 1 g auf 0,01 g
    [0.125, '0,13 g'],
    [0.1, '0,10 g'],
    [0.02, '0,02 g'],
    [0.015, '0,02 g'],
    // knapp über 0,0125 g: normal auf 0,01 g
    [0.0126, '0,01 g'],
    // bis 0,0125 g einschließlich: „<0,01 g“
    [0.0125, '<0,01 g'],
    [0.01, '<0,01 g'],
    [0, '<0,01 g'],
  ])('%d g → „%s“', (value, expected) => {
    expect(formatNutrient('salt', value)).toBe(t(expected))
  })
})

describe('roundNutrient', () => {
  it('liefert Wert und Stellenzahl (z. B. für animierte Zahlen)', () => {
    expect(roundNutrient('protein', 13.675)).toEqual({ kind: 'value', value: 14, decimals: 0 })
    expect(roundNutrient('salt', 0.125)).toEqual({ kind: 'value', value: 0.13, decimals: 2 })
  })

  it('meldet „kleiner als“ mit der Grenze', () => {
    expect(roundNutrient('fat', 0.2)).toEqual({ kind: 'below', limit: 0.5, decimals: 1 })
    expect(roundNutrient('saturatedFat', 0.1)).toEqual({ kind: 'below', limit: 0.1, decimals: 1 })
    expect(roundNutrient('salt', 0.0125)).toEqual({ kind: 'below', limit: 0.01, decimals: 2 })
  })
})

describe('formatShare', () => {
  it('zeigt ganze Prozent', () => {
    expect(formatShare(0.75)).toBe(t('75 %'))
    expect(formatShare(1)).toBe(t('100 %'))
    expect(formatShare(1 / 3)).toBe(t('33 %'))
    expect(formatShare(0.125)).toBe(t('13 %'))
  })

  it('zeigt winzige Anteile als „<1 %“ statt „0 %“', () => {
    expect(formatShare(0.004)).toBe(t('<1 %'))
    expect(formatShare(0.005)).toBe(t('1 %'))
  })

  it('zeigt einen leeren Anteil als „0 %“', () => {
    expect(formatShare(0)).toBe(t('0 %'))
  })
})

describe('formatGrams', () => {
  it('zeigt ganze Gramm ohne Komma', () => {
    expect(formatGrams(50)).toBe(t('50 g'))
    expect(formatGrams(400)).toBe(t('400 g'))
  })

  it('zeigt eine Nachkommastelle, wenn es eine gibt', () => {
    expect(formatGrams(12.5)).toBe(t('12,5 g'))
    expect(formatGrams(0.1 + 0.2)).toBe(t('0,3 g'))
  })
})

import { describe, expect, it } from 'vitest'
import {
  emptyNutritionInput,
  kcalToKj,
  nutritionToInput,
  parseNutritionInput,
  type NutritionInput,
} from './nutrition'

/** Haferflocken laut Packung. */
const oats: NutritionInput = {
  kcal: '372',
  kj: '1574',
  fat: '7',
  saturatedFat: '1,3',
  carbs: '58,7',
  sugar: '0,7',
  fiber: '10',
  protein: '13,5',
  salt: '0,01',
}

describe('kcalToKj', () => {
  it('rechnet mit 4,184 und rundet nicht', () => {
    expect(kcalToKj(100)).toBeCloseTo(418.4, 10)
    expect(kcalToKj(372)).toBeCloseTo(1556.448, 10)
  })
})

describe('parseNutritionInput', () => {
  it('liest vollständige Eingaben mit Dezimalkomma', () => {
    const r = parseNutritionInput(oats)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value.protein).toBe(13.5)
      expect(r.value.kj).toBe(1574)
      expect(r.value.salt).toBe(0.01)
    }
  })

  it('berechnet kJ aus kcal, wenn kJ leer ist', () => {
    const r = parseNutritionInput({ ...oats, kj: '' })
    expect(r.ok && r.value.kj).toBeCloseTo(1556.448, 10)
  })

  it('übernimmt ein selbst eingetragenes kJ, auch wenn es vom Vorschlag abweicht', () => {
    const r = parseNutritionInput({ ...oats, kj: '1560' })
    expect(r.ok && r.value.kj).toBe(1560)
  })

  it('akzeptiert 0 als Wert', () => {
    const r = parseNutritionInput({ ...oats, sugar: '0', salt: '0' })
    expect(r.ok).toBe(true)
  })

  it('verlangt alle Felder außer kJ', () => {
    const r = parseNutritionInput(emptyNutritionInput())
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.errors.fat).toBe('Bitte ausfüllen')
      expect(r.errors.kcal).toBe('Bitte ausfüllen')
      expect(r.errors.kj).toBe('Bitte kcal oder kJ angeben')
    }
  })

  it('meldet ungültige Zahlen', () => {
    const r = parseNutritionInput({ ...oats, protein: '13,5g' })
    expect(!r.ok && r.errors.protein).toBe('Bitte eine Zahl eingeben')
  })

  it('meldet Werte außerhalb des Bereichs', () => {
    const r = parseNutritionInput({ ...oats, carbs: '101', kcal: '950' })
    expect(!r.ok && r.errors.carbs).toBe('Höchstens 100 g')
    expect(!r.ok && r.errors.kcal).toBe('Höchstens 900 kcal')
  })

  it('meldet negative Werte', () => {
    const r = parseNutritionInput({ ...oats, fiber: '-1' })
    expect(!r.ok && r.errors.fiber).toBe('Darf nicht negativ sein')
  })

  it('prüft „davon“-Werte gegen den Oberwert', () => {
    const r = parseNutritionInput({ ...oats, saturatedFat: '8', sugar: '60' })
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.errors.saturatedFat).toBe('Mehr als Fett')
      expect(r.errors.sugar).toBe('Mehr als Kohlenhydrate')
    }
  })

  it('erlaubt „davon“-Werte gleich dem Oberwert', () => {
    const r = parseNutritionInput({ ...oats, carbs: '70', sugar: '70' })
    expect(r.ok).toBe(true)
  })
})

describe('nutritionToInput', () => {
  it('ergibt nach erneutem Lesen dieselben Werte', () => {
    const first = parseNutritionInput({ ...oats, kj: '' })
    if (!first.ok) throw new Error('Testdaten ungültig')
    const again = parseNutritionInput(nutritionToInput(first.value))
    expect(again).toEqual(first)
  })
})

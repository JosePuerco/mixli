import { describe, expect, it } from 'vitest'
import type { IngredientSnapshot } from '../db/types'
import { NBSP } from '../lib/format'
import {
  eurosPerGram,
  formatEuros,
  formatEurosPerKg,
  hasPriceInput,
  mixPrice,
  parsePriceInput,
  priceSchema,
  priceToInput,
  type Price,
} from './price'

const snap = (name: string, price?: Price): IngredientSnapshot => ({
  name,
  nutrition: { kj: 0, kcal: 0, fat: 0, saturatedFat: 0, carbs: 0, sugar: 0, fiber: 0, protein: 0, salt: 0 },
  allergensContains: [],
  allergensTraces: [],
  ...(price && { price }),
})

describe('eurosPerGram', () => {
  it('rechnet Packung und pro 100 g auf Euro pro Gramm um', () => {
    expect(eurosPerGram({ kind: 'package', euros: 2.49, grams: 500 })).toBeCloseTo(0.00498, 10)
    expect(eurosPerGram({ kind: 'per100g', euros: 0.5 })).toBeCloseTo(0.005, 10)
  })
})

describe('parsePriceInput', () => {
  it('liest Packungspreis und Packungsgröße mit Komma', () => {
    expect(parsePriceInput({ kind: 'package', euros: '2,49', grams: '500' })).toEqual({
      ok: true,
      value: { kind: 'package', euros: 2.49, grams: 500 },
    })
  })

  it('liest pro 100 g und ignoriert dabei die Packungsgröße', () => {
    expect(parsePriceInput({ kind: 'per100g', euros: '0,5', grams: 'quatsch' })).toEqual({
      ok: true,
      value: { kind: 'per100g', euros: 0.5 },
    })
  })

  it('verlangt Preis und bei Packung die Größe', () => {
    expect(parsePriceInput({ kind: 'package', euros: '', grams: '' })).toEqual({
      ok: false,
      errors: { euros: 'Bitte einen Preis eingeben', grams: 'Bitte die Packungsgröße eingeben' },
    })
  })

  it('lehnt ungültige, negative und zu große Werte ab', () => {
    const err = (euros: string, grams = '500') => {
      const r = parsePriceInput({ kind: 'package', euros, grams })
      return r.ok ? undefined : r.errors
    }
    expect(err('abc')).toEqual({ euros: 'Keine gültige Zahl' })
    expect(err('-1')).toEqual({ euros: 'Darf nicht negativ sein' })
    expect(err('10000')).toEqual({ euros: 'Höchstens 9999,99 €' })
    expect(err('1', '0')).toEqual({ grams: 'Muss größer als 0 sein' })
    expect(err('0')).toBeUndefined()
  })

  it('ergibt nach priceToInput denselben Preis', () => {
    const prices: Price[] = [
      { kind: 'package', euros: 3.99, grams: 750 },
      { kind: 'per100g', euros: 1.2 },
    ]
    for (const p of prices) expect(parsePriceInput(priceToInput(p))).toEqual({ ok: true, value: p })
    expect(priceToInput(undefined)).toEqual({ kind: 'package', euros: '', grams: '' })
  })
})

describe('hasPriceInput', () => {
  it('zählt die Packungsgröße nur bei „Packung“', () => {
    expect(hasPriceInput({ kind: 'package', euros: ' ', grams: '' })).toBe(false)
    expect(hasPriceInput({ kind: 'package', euros: '', grams: '500' })).toBe(true)
    expect(hasPriceInput({ kind: 'per100g', euros: '', grams: '500' })).toBe(false)
  })
})

describe('mixPrice', () => {
  it('summiert nach Gewicht und rechnet auf kg um', () => {
    // 300 g Hafer zu 1,49 € je 500 g = 0,894 €; 100 g Rosinen zu 0,80 € je 100 g = 0,80 €
    const r = mixPrice([
      { grams: 300, snapshot: snap('Hafer', { kind: 'package', euros: 1.49, grams: 500 }) },
      { grams: 100, snapshot: snap('Rosinen', { kind: 'per100g', euros: 0.8 }) },
    ])
    expect(r?.complete).toBe(true)
    if (r?.complete) {
      expect(r.total).toBeCloseTo(1.694, 10)
      expect(r.perKg).toBeCloseTo(4.235, 10)
    }
  })

  it('meldet Zeilen ohne Preis statt einer Summe', () => {
    expect(
      mixPrice([
        { grams: 300, snapshot: snap('Hafer', { kind: 'per100g', euros: 0.3 }) },
        { grams: 50, snapshot: snap('Rosinen') },
        { grams: 50, snapshot: snap('Mandeln') },
      ]),
    ).toEqual({ complete: false, missing: ['Rosinen', 'Mandeln'] })
  })

  it('übergeht Zeilen mit 0 g und ist bei leerem Mix null', () => {
    expect(mixPrice([])).toBeNull()
    expect(mixPrice([{ grams: 0, snapshot: snap('Rosinen') }])).toBeNull()
    const r = mixPrice([
      { grams: 100, snapshot: snap('Hafer', { kind: 'per100g', euros: 0.3 }) },
      { grams: 0, snapshot: snap('Rosinen') },
    ])
    expect(r?.complete).toBe(true)
    if (r?.complete) {
      expect(r.total).toBeCloseTo(0.3, 10)
      expect(r.perKg).toBeCloseTo(3, 10)
    }
  })
})

describe('Anzeige', () => {
  it('rundet kaufmännisch auf Cent, mit Komma und geschütztem Leerzeichen', () => {
    expect(formatEuros(1.694)).toBe(`1,69${NBSP}€`)
    expect(formatEuros(1.005)).toBe(`1,01${NBSP}€`)
    expect(formatEuros(0)).toBe(`0,00${NBSP}€`)
    expect(formatEurosPerKg(4.235)).toBe(`4,24${NBSP}€/kg`)
  })
})

describe('priceSchema', () => {
  it('prüft beide Arten', () => {
    expect(priceSchema.safeParse({ kind: 'package', euros: 1, grams: 500 }).success).toBe(true)
    expect(priceSchema.safeParse({ kind: 'package', euros: 1 }).success).toBe(false)
    expect(priceSchema.safeParse({ kind: 'per100g', euros: -1 }).success).toBe(false)
    expect(priceSchema.safeParse({ kind: 'kg', euros: 1 }).success).toBe(false)
  })
})

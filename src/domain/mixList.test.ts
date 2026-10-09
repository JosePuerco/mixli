import { describe, expect, it } from 'vitest'
import { allergenSummary, hiddenMixesLabel, ingredientNames, mixCountLabel, mixMeta, sortMixes } from './mixList'

const mix = (name: string, day: number) => ({ name, createdAt: new Date(2026, 9, day, 8) })

describe('sortMixes', () => {
  const list = [mix('Nussfrei', 2), mix('Frühstück Basic', 7), mix('Schoko-Crunch', 1), mix('Äpfelmüsli', 5)]

  it('„Neueste“: zuletzt angelegt zuerst', () => {
    expect(sortMixes(list, 'newest').map((m) => m.name)).toEqual(['Frühstück Basic', 'Äpfelmüsli', 'Nussfrei', 'Schoko-Crunch'])
  })

  it('„A–Z“: nach Name, Umlaute richtig einsortiert', () => {
    expect(sortMixes(list, 'az').map((m) => m.name)).toEqual(['Äpfelmüsli', 'Frühstück Basic', 'Nussfrei', 'Schoko-Crunch'])
  })

  it('ändert die Ausgangsliste nicht', () => {
    const copy = [...list]
    sortMixes(list, 'az')
    expect(list).toEqual(copy)
  })

  it('sortiert gleiche Namen nach Datum, gleiches Datum nach Name', () => {
    expect(sortMixes([mix('B', 1), mix('B', 3)], 'az').map((m) => m.createdAt.getDate())).toEqual([3, 1])
    expect(sortMixes([mix('B', 1), mix('A', 1)], 'newest').map((m) => m.name)).toEqual(['A', 'B'])
  })
})

describe('hiddenMixesLabel', () => {
  it('Einzahl und Mehrzahl', () => {
    expect(hiddenMixesLabel(1)).toBe('1 Müsli passt nicht zum Filter und ist ausgeblendet.')
    expect(hiddenMixesLabel(3)).toBe('3 Müslis passen nicht zum Filter und sind ausgeblendet.')
  })
})

describe('mixCountLabel', () => {
  it('nennt die Anzahl', () => {
    expect(mixCountLabel(1)).toBe('1 gespeichert')
    expect(mixCountLabel(3)).toBe('3 gespeichert')
  })
})

describe('mixMeta', () => {
  it('zeigt für wen und das Datum', () => {
    expect(mixMeta({ forWhom: 'Lena', createdAt: new Date(2026, 9, 7) })).toBe('Für Lena · 07.10.2026')
  })

  it('zeigt ohne „für wen“ nur das Datum', () => {
    expect(mixMeta({ createdAt: new Date(2026, 9, 7) })).toBe('07.10.2026')
  })
})

describe('ingredientNames', () => {
  it('nennt die Zutaten in der Reihenfolge des Mixes', () => {
    const snap = (name: string) => ({ snapshot: { name, nutrition: {} as never, allergensContains: [], allergensTraces: [] } })
    expect(ingredientNames([snap('Haferflocken'), snap('Mandeln'), snap('Rosinen')])).toBe('Haferflocken, Mandeln, Rosinen')
  })
})

describe('allergenSummary', () => {
  it('nennt „enthält“ und fasst die Spuren zusammen', () => {
    expect(allergenSummary({ contains: ['gluten'], traces: ['milk', 'nuts'] })).toBe('Gluten · Spuren: Milch, Schalenfrüchte')
  })

  it('kommt ohne Spuren und ohne „enthält“ aus', () => {
    expect(allergenSummary({ contains: ['gluten', 'nuts'], traces: [] })).toBe('Gluten · Schalenfrüchte')
    expect(allergenSummary({ contains: [], traces: ['sesame'] })).toBe('Spuren: Sesam')
  })

  it('sagt „Keine Allergene“, wenn es keine gibt', () => {
    expect(allergenSummary({ contains: [], traces: [] })).toBe('Keine Allergene')
  })
})

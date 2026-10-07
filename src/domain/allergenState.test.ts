import { describe, expect, it } from 'vitest'
import { fromAllergenLists, nextAllergenState, toAllergenLists } from './allergenState'

describe('nextAllergenState', () => {
  it('schaltet im Kreis: nicht enthalten → enthält → Spuren → nicht enthalten', () => {
    expect(nextAllergenState()).toBe('contains')
    expect(nextAllergenState('none')).toBe('contains')
    expect(nextAllergenState('contains')).toBe('traces')
    expect(nextAllergenState('traces')).toBe('none')
  })
})

describe('toAllergenLists', () => {
  it('trennt „enthält“ und „Spuren“ und sortiert nach der festen Liste', () => {
    const lists = toAllergenLists({ sesame: 'traces', nuts: 'contains', gluten: 'contains', milk: 'none' })
    expect(lists.contains).toEqual(['gluten', 'nuts'])
    expect(lists.traces).toEqual(['sesame'])
  })

  it('ergibt leere Listen ohne Auswahl', () => {
    expect(toAllergenLists({})).toEqual({ contains: [], traces: [] })
  })
})

describe('fromAllergenLists', () => {
  it('ist die Umkehrung von toAllergenLists', () => {
    const states = fromAllergenLists(['gluten'], ['nuts', 'sesame'])
    expect(states).toEqual({ gluten: 'contains', nuts: 'traces', sesame: 'traces' })
    expect(toAllergenLists(states)).toEqual({ contains: ['gluten'], traces: ['nuts', 'sesame'] })
  })

  it('lässt „enthält“ gewinnen, wenn ein Allergen in beiden Listen steht', () => {
    expect(fromAllergenLists(['nuts'], ['nuts'])).toEqual({ nuts: 'contains' })
  })
})

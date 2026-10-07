// Allergen-Kacheln im Formular: drei Zustände pro Allergen. Gespeichert werden zwei getrennte Listen
// („enthält“ und „Spuren“), damit beide immer auseinandergehalten werden.
import { ALLERGENS, type AllergenId } from './allergens'

export type AllergenState = 'none' | 'contains' | 'traces'
export type AllergenStates = Partial<Record<AllergenId, AllergenState>>

export const ALLERGEN_STATE_LABEL: Record<AllergenState, string> = {
  none: 'nicht enthalten',
  contains: 'enthält',
  traces: 'Spuren',
}

/** Tippen schaltet um: nicht enthalten → enthält → Spuren → nicht enthalten. */
export function nextAllergenState(state: AllergenState = 'none'): AllergenState {
  return state === 'none' ? 'contains' : state === 'contains' ? 'traces' : 'none'
}

/** Formularzustand → zwei Listen in fester Reihenfolge der 14 Allergene. */
export function toAllergenLists(states: AllergenStates): { contains: AllergenId[]; traces: AllergenId[] } {
  const contains: AllergenId[] = []
  const traces: AllergenId[] = []
  for (const { id } of ALLERGENS) {
    if (states[id] === 'contains') contains.push(id)
    else if (states[id] === 'traces') traces.push(id)
  }
  return { contains, traces }
}

/** Zwei Listen → Formularzustand. Steht ein Allergen in beiden, gewinnt „enthält“. */
export function fromAllergenLists(contains: readonly AllergenId[], traces: readonly AllergenId[]): AllergenStates {
  const states: AllergenStates = {}
  for (const id of traces) states[id] = 'traces'
  for (const id of contains) states[id] = 'contains'
  return states
}

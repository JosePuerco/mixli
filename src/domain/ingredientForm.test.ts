import { describe, expect, it } from 'vitest'
import {
  emptyFormValues,
  formValuesFromIngredient,
  hasInput,
  toDraft,
  validateName,
  type IngredientFormValues,
} from './ingredientForm'
import type { Ingredient } from '../db/types'

const filled = (): IngredientFormValues => ({
  ...emptyFormValues(),
  name: 'Mandeln',
  brand: 'ganz',
  tags: ['vegan'],
  nutrition: {
    kcal: '600', kj: '', fat: '52', saturatedFat: '4', carbs: '5,7', sugar: '4,4', fiber: '12', protein: '24', salt: '0',
  },
  allergens: { nuts: 'contains', peanuts: 'traces', gluten: 'none' },
})

describe('validateName', () => {
  it('verlangt einen Namen', () => {
    expect(validateName('  ')).toBe('Bitte einen Namen eingeben')
    expect(validateName('Hafer')).toBeUndefined()
  })

  it('begrenzt die Länge', () => {
    expect(validateName('x'.repeat(81))).toBe('Höchstens 80 Zeichen')
  })
})

describe('toDraft', () => {
  it('baut einen Entwurf mit getrennten Allergen-Listen', () => {
    const r = toDraft(filled())
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.draft.allergensContains).toEqual(['nuts'])
      expect(r.draft.allergensTraces).toEqual(['peanuts'])
      expect(r.draft.nutrition.kj).toBeCloseTo(2510.4, 10)
      expect(r.draft.nutrition.carbs).toBe(5.7)
    }
  })

  it('sammelt Fehler zu Name und Nährwerten', () => {
    const r = toDraft({ ...filled(), name: '', nutrition: { ...filled().nutrition, fat: '' } })
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.errors.name).toBe('Bitte einen Namen eingeben')
      expect(r.errors.nutrition.fat).toBe('Bitte ausfüllen')
    }
  })
})

describe('formValuesFromIngredient', () => {
  it('ergibt beim erneuten Speichern dieselben Werte', () => {
    const first = toDraft(filled())
    if (!first.ok) throw new Error('Testdaten ungültig')
    const ingredient: Ingredient = {
      ...first.draft,
      id: 'x',
      archived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const again = toDraft(formValuesFromIngredient(ingredient))
    expect(again).toEqual(first)
  })
})

describe('hasInput', () => {
  it('ist bei einem leeren Formular falsch', () => {
    expect(hasInput(emptyFormValues())).toBe(false)
    expect(hasInput({ ...emptyFormValues(), name: '   ', allergens: { nuts: 'none' } })).toBe(false)
  })

  it('erkennt jede Eingabe', () => {
    expect(hasInput({ ...emptyFormValues(), name: 'H' })).toBe(true)
    expect(hasInput({ ...emptyFormValues(), tags: ['Bio'] })).toBe(true)
    expect(hasInput({ ...emptyFormValues(), allergens: { nuts: 'traces' } })).toBe(true)
    expect(hasInput({ ...emptyFormValues(), nutrition: { ...emptyFormValues().nutrition, salt: '0' } })).toBe(true)
  })
})

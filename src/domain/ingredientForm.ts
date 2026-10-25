// Formularzustand für „Zutat anlegen“ und „Zutat bearbeiten“: Werte so, wie sie getippt werden,
// Prüfung und Umwandlung in einen speicherbaren Entwurf. Das Foto verwalten die Screens getrennt.
import type { Ingredient } from '../db/types'
import { fromAllergenLists, toAllergenLists, type AllergenStates } from './allergenState'
import type { IngredientDraft } from './ingredient'
import {
  emptyNutritionInput,
  nutritionToInput,
  parseNutritionInput,
  type NutritionErrors,
  type NutritionInput,
} from './nutrition'
import { emptyPriceInput, hasPriceInput, parsePriceInput, priceToInput, type PriceErrors, type PriceInput } from './price'

export interface IngredientFormValues {
  name: string
  brand: string
  categoryId?: string
  tags: string[]
  price: PriceInput
  nutrition: NutritionInput
  allergens: AllergenStates
  note: string
}

export interface IngredientFormErrors {
  name?: string
  price: PriceErrors
  nutrition: NutritionErrors
}

export type FormResult = { ok: true; draft: IngredientDraft } | { ok: false; errors: IngredientFormErrors }

export const NAME_MAX_LENGTH = 80

export function emptyFormValues(): IngredientFormValues {
  return { name: '', brand: '', tags: [], price: emptyPriceInput(), nutrition: emptyNutritionInput(), allergens: {}, note: '' }
}

export function formValuesFromIngredient(i: Ingredient): IngredientFormValues {
  return {
    name: i.name,
    brand: i.brand ?? '',
    categoryId: i.categoryId,
    tags: [...i.tags],
    // Zutaten von vor den Preisen: leer, der Preis wird beim Speichern verlangt.
    price: priceToInput(i.price),
    nutrition: nutritionToInput(i.nutrition),
    allergens: fromAllergenLists(i.allergensContains, i.allergensTraces),
    note: i.note ?? '',
  }
}

/** Fehlermeldung zum Namen oder undefined. */
export function validateName(name: string): string | undefined {
  if (!name.trim()) return 'Bitte einen Namen eingeben'
  if (name.trim().length > NAME_MAX_LENGTH) return `Höchstens ${NAME_MAX_LENGTH} Zeichen`
  return undefined
}

/** Prüft alles und baut den Entwurf zum Speichern. */
export function toDraft(v: IngredientFormValues): FormResult {
  const name = validateName(v.name)
  const price = parsePriceInput(v.price)
  const nutrition = parseNutritionInput(v.nutrition)
  if (name || !price.ok || !nutrition.ok) {
    return {
      ok: false,
      errors: { name, price: price.ok ? {} : price.errors, nutrition: nutrition.ok ? {} : nutrition.errors },
    }
  }
  const { contains, traces } = toAllergenLists(v.allergens)
  return {
    ok: true,
    draft: {
      name: v.name,
      brand: v.brand,
      categoryId: v.categoryId,
      tags: v.tags,
      price: price.value,
      nutrition: nutrition.value,
      allergensContains: contains,
      allergensTraces: traces,
      note: v.note,
    },
  }
}

/** Hat jemand schon etwas eingegeben? (Dann vor dem Schließen nachfragen.) */
export function hasInput(v: IngredientFormValues): boolean {
  return (
    v.name.trim() !== '' ||
    v.brand.trim() !== '' ||
    v.note.trim() !== '' ||
    v.categoryId !== undefined ||
    v.tags.length > 0 ||
    hasPriceInput(v.price) ||
    Object.values(v.nutrition).some((s) => s.trim() !== '') ||
    Object.values(v.allergens).some((s) => s !== 'none')
  )
}

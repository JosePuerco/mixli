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

export interface IngredientFormValues {
  name: string
  brand: string
  categoryId?: string
  tags: string[]
  nutrition: NutritionInput
  allergens: AllergenStates
  note: string
}

export interface IngredientFormErrors {
  name?: string
  nutrition: NutritionErrors
}

export type FormResult = { ok: true; draft: IngredientDraft } | { ok: false; errors: IngredientFormErrors }

export const NAME_MAX_LENGTH = 80

export function emptyFormValues(): IngredientFormValues {
  return { name: '', brand: '', tags: [], nutrition: emptyNutritionInput(), allergens: {}, note: '' }
}

export function formValuesFromIngredient(i: Ingredient): IngredientFormValues {
  return {
    name: i.name,
    brand: i.brand ?? '',
    categoryId: i.categoryId,
    tags: [...i.tags],
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
  const nutrition = parseNutritionInput(v.nutrition)
  if (name || !nutrition.ok) {
    return { ok: false, errors: { name, nutrition: nutrition.ok ? {} : nutrition.errors } }
  }
  const { contains, traces } = toAllergenLists(v.allergens)
  return {
    ok: true,
    draft: {
      name: v.name,
      brand: v.brand,
      categoryId: v.categoryId,
      tags: v.tags,
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
    Object.values(v.nutrition).some((s) => s.trim() !== '') ||
    Object.values(v.allergens).some((s) => s !== 'none')
  )
}

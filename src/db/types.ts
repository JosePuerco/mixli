// Datenmodell laut PLAN.md („Datenmodell“). Alle Nährwerte pro 100 g, intern exakt (nicht gerundet).
import type { AllergenId } from '../domain/allergens'

export interface Nutrition {
  kj: number
  kcal: number
  fat: number
  saturatedFat: number
  carbs: number
  sugar: number
  fiber: number
  protein: number
  salt: number
}

export interface Ingredient {
  id: string
  name: string
  brand?: string
  categoryId?: string
  photoId?: string
  nutrition: Nutrition
  allergensContains: AllergenId[]
  allergensTraces: AllergenId[]
  tags: string[]
  note?: string
  archived: boolean
  createdAt: Date
  updatedAt: Date
}

/** Kopie der Zutatenwerte zum Zeitpunkt des Speicherns, damit alte Etiketten korrekt bleiben. */
export interface IngredientSnapshot {
  name: string
  brand?: string
  nutrition: Nutrition
  allergensContains: AllergenId[]
  allergensTraces: AllergenId[]
}

export interface MixItem {
  ingredientId: string
  grams: number
  snapshot: IngredientSnapshot
}

export interface Mix {
  id: string
  name: string
  forWhom?: string
  items: MixItem[]
  note?: string
  createdAt: Date
  updatedAt: Date
}

export interface Photo {
  id: string
  blob: Blob
  createdAt: Date
}

export interface Category {
  id: string
  name: string
  order: number
}

export interface Setting {
  key: string
  value: unknown
}

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

/**
 * Foto als reine Bytes plus Bildtyp. Bewusst kein Blob: Safari hatte wiederholt Fehler beim
 * Speichern von Blobs in IndexedDB, Bytes (ArrayBuffer) funktionieren überall.
 */
export interface Photo {
  id: string
  data: ArrayBuffer
  /** z. B. „image/webp“ oder „image/jpeg“. */
  type: string
  createdAt: Date
  /** Nur in Einträgen aus der allerersten Phase-1-Version; wird nur noch gelesen. */
  blob?: Blob
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

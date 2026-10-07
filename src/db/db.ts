// Lokale Datenbank (IndexedDB über Dexie). Alle Daten bleiben auf dem Gerät.
// Schema-Änderungen immer als neue version(n) anlegen, nie eine bestehende Version ändern.
import { Dexie, type EntityTable } from 'dexie'
import type { Category, Ingredient, Mix, Photo, Setting } from './types'

export class MixliDB extends Dexie {
  ingredients!: EntityTable<Ingredient, 'id'>
  mixes!: EntityTable<Mix, 'id'>
  photos!: EntityTable<Photo, 'id'>
  categories!: EntityTable<Category, 'id'>
  settings!: EntityTable<Setting, 'key'>

  constructor() {
    super('mixli')
    // Nur indizierte Felder stehen hier; alle anderen Felder werden trotzdem gespeichert.
    this.version(1).stores({
      ingredients: 'id, name, categoryId, updatedAt',
      mixes: 'id, name, createdAt',
      photos: 'id',
      categories: 'id, order',
      settings: 'key',
    })
  }
}

export const db = new MixliDB()

/**
 * Bittet den Browser, die Daten dauerhaft zu behalten (wichtig auf iOS,
 * sonst darf Safari ungenutzte Website-Daten nach einiger Zeit löschen).
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) return false
  if (await navigator.storage.persisted()) return true
  return navigator.storage.persist()
}

// Backup einlesen: erst vollständig prüfen (parseBackup), dann in EINER Transaktion schreiben
// (applyBackup). Ist die Datei fehlerhaft, wird nichts geschrieben; bricht das Schreiben ab,
// bleibt der alte Stand erhalten.
//
// Zusammenführen gleicht streng über die id ab:
// - Zutaten und Müslis: Die Version mit dem neueren updatedAt gewinnt; ist die auf dem Gerät neuer
//   (oder gleich alt), bleibt sie.
// - Kategorien, Fotos, Einstellungen haben kein Änderungsdatum: Vorhandenes bleibt, Fehlendes kommt dazu.
import { db } from '../db/db'
import type { Category, Ingredient, Mix, Photo } from '../db/types'
import { backupSchema, DEVICE_SETTING_KEYS, type BackupData } from './format'
import { BackupError, migrateBackup } from './migrate'

export type ImportMode = 'replace' | 'merge'

export interface ImportResult {
  /** Neu angelegte oder überschriebene Datensätze. */
  ingredients: number
  mixes: number
  categories: number
  photos: number
  /** Zutaten und Müslis, deren Version auf dem Gerät neuer war und deshalb blieb. */
  keptNewer: number
  /** Verweise auf Kategorien oder Fotos, die es nicht gibt; sie wurden geleert. */
  brokenRefs: number
}

/** Text der Datei → geprüfte Daten. Wirft BackupError mit einer anzeigbaren Meldung. */
export function parseBackup(text: string): BackupData {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new BackupError('Die Datei lässt sich nicht lesen. Ist es wirklich ein Mixli-Backup?')
  }
  const result = backupSchema.safeParse(migrateBackup(raw))
  if (!result.success) {
    const issue = result.error.issues[0]
    const where = issue?.path.length ? ` (bei ${issue.path.join('.')})` : ''
    throw new BackupError(`Die Backup-Datei ist beschädigt oder unvollständig${where}.`)
  }
  return result.data
}

/** Kurzbeschreibung für die Rückfrage vor dem Import. */
export function backupCounts(data: BackupData) {
  return {
    ingredients: data.data.ingredients.length,
    mixes: data.data.mixes.length,
    categories: data.data.categories.length,
    photos: data.data.photos.length,
  }
}

/** Zutaten und Müslis können ein Foto haben. */
type WithPhoto = { id: string; photoId?: string }

/** Alle Foto-ids dieser Zeilen, ohne Doppelte. */
function photoIdsOf(rows: readonly WithPhoto[]): string[] {
  return [...new Set(rows.flatMap((r) => (r.photoId ? [r.photoId] : [])))]
}

/** Leert Verweise auf Kategorien oder Fotos, die es nicht gibt. Gibt die Anzahl zurück. */
function fixRefs(ingredients: Ingredient[], mixes: Mix[], categoryIds: Set<string>, photoIds: Set<string>): number {
  let broken = 0
  for (const i of ingredients) {
    if (i.categoryId !== undefined && !categoryIds.has(i.categoryId)) {
      delete i.categoryId
      broken++
    }
  }
  for (const row of [...ingredients, ...mixes]) {
    if (row.photoId !== undefined && !photoIds.has(row.photoId)) {
      delete row.photoId
      broken++
    }
  }
  return broken
}

/**
 * Fotos, die nach dem Überschreiben niemand mehr braucht: Die Zeile auf dem Gerät hatte ein Foto,
 * die übernommene Version aus der Datei ein anderes (oder keins).
 */
function unusedAfterWrite<T extends WithPhoto>(onDevice: T[], written: T[], stillUsed: Set<string>): string[] {
  const writtenIds = new Set(written.map((r) => r.id))
  return onDevice.filter((r) => writtenIds.has(r.id) && r.photoId && !stillUsed.has(r.photoId)).map((r) => r.photoId!)
}

/** Zeilen nach dem Schreiben: überschriebene durch die neue Version ersetzt, neue dazu. */
function afterWrite<T extends WithPhoto>(onDevice: T[], written: T[]): T[] {
  const byId = new Map(onDevice.map((r) => [r.id, r]))
  for (const r of written) byId.set(r.id, r)
  return [...byId.values()]
}

/** Nimmt die Zeile aus der Datei, wenn es sie auf dem Gerät nicht gibt oder die Datei-Version neuer ist. */
function newerOnly<T extends { id: string; updatedAt: Date }>(fromFile: T[], onDevice: T[]) {
  const existing = new Map(onDevice.map((row) => [row.id, row]))
  const write: T[] = []
  let kept = 0
  for (const row of fromFile) {
    const old = existing.get(row.id)
    if (!old || row.updatedAt.getTime() > old.updatedAt.getTime()) write.push(row)
    else if (old.updatedAt.getTime() > row.updatedAt.getTime()) kept++
  }
  return { write, kept }
}

export async function applyBackup(backup: BackupData, mode: ImportMode): Promise<ImportResult> {
  const file = backup.data
  // Kopien, damit fixRefs die geprüften Daten des Aufrufers nicht verändert.
  const fileIngredients: Ingredient[] = file.ingredients.map((i) => ({ ...i }))
  const fileMixes: Mix[] = file.mixes.map((m) => ({ ...m }))
  const fileCategories: Category[] = file.categories
  const filePhotos = new Map<string, Photo>(file.photos.map((p) => [p.id, p]))
  const fileSettings = file.settings.filter((s) => !DEVICE_SETTING_KEYS.includes(s.key))

  const tables = [db.categories, db.ingredients, db.mixes, db.photos, db.settings]
  return db.transaction('rw', tables, async () => {
    if (mode === 'replace') {
      await Promise.all([db.categories.clear(), db.ingredients.clear(), db.mixes.clear(), db.photos.clear()])
      const settings = await db.settings.toArray()
      await db.settings.bulkDelete(settings.filter((s) => !DEVICE_SETTING_KEYS.includes(s.key)).map((s) => s.key))

      const brokenRefs = fixRefs(
        fileIngredients,
        fileMixes,
        new Set(fileCategories.map((c) => c.id)),
        new Set(filePhotos.keys()),
      )
      // Nur Fotos, die eine Zutat oder ein Müsli auch benutzt.
      const photos = photoIdsOf([...fileIngredients, ...fileMixes]).map((id) => filePhotos.get(id)!)

      await db.categories.bulkPut(fileCategories)
      await db.photos.bulkPut(photos)
      await db.ingredients.bulkPut(fileIngredients)
      await db.mixes.bulkPut(fileMixes)
      await db.settings.bulkPut(fileSettings)
      return {
        ingredients: fileIngredients.length,
        mixes: fileMixes.length,
        categories: fileCategories.length,
        photos: photos.length,
        keptNewer: 0,
        brokenRefs,
      }
    }

    const [deviceCategories, deviceIngredients, deviceMixes, devicePhotos, deviceSettings] = await Promise.all([
      db.categories.toArray(),
      db.ingredients.toArray(),
      db.mixes.toArray(),
      db.photos.toArray(),
      db.settings.toArray(),
    ])

    const knownCategoryIds = new Set(deviceCategories.map((c) => c.id))
    const newCategories = fileCategories.filter((c) => !knownCategoryIds.has(c.id))
    const ingredients = newerOnly(fileIngredients, deviceIngredients)
    const mixes = newerOnly(fileMixes, deviceMixes)

    const devicePhotoIds = new Set(devicePhotos.map((p) => p.id))
    const brokenRefs = fixRefs(
      ingredients.write,
      mixes.write,
      new Set([...knownCategoryIds, ...newCategories.map((c) => c.id)]),
      new Set([...devicePhotoIds, ...filePhotos.keys()]),
    )

    // Fotos der übernommenen Zutaten und Müslis, die auf dem Gerät noch fehlen.
    const newPhotos = photoIdsOf([...ingredients.write, ...mixes.write])
      .filter((id) => !devicePhotoIds.has(id))
      .map((id) => filePhotos.get(id)!)

    // Überschriebene Zeilen können ein anderes Foto gehabt haben; das wird dann nicht mehr gebraucht.
    const stillUsed = new Set(
      photoIdsOf([...afterWrite(deviceIngredients, ingredients.write), ...afterWrite(deviceMixes, mixes.write)]),
    )
    const unusedPhotos = [
      ...unusedAfterWrite(deviceIngredients, ingredients.write, stillUsed),
      ...unusedAfterWrite(deviceMixes, mixes.write, stillUsed),
    ]

    const knownSettings = new Set(deviceSettings.map((s) => s.key))
    const newSettings = fileSettings.filter((s) => !knownSettings.has(s.key))

    await db.categories.bulkPut(newCategories)
    await db.photos.bulkPut(newPhotos)
    await db.photos.bulkDelete(unusedPhotos)
    await db.ingredients.bulkPut(ingredients.write)
    await db.mixes.bulkPut(mixes.write)
    await db.settings.bulkPut(newSettings)
    return {
      ingredients: ingredients.write.length,
      mixes: mixes.write.length,
      categories: newCategories.length,
      photos: newPhotos.length,
      keptNewer: ingredients.kept + mixes.kept,
      brokenRefs,
    }
  })
}

/** Datei lesen, prüfen und schreiben in einem Schritt (z. B. für Tests). */
export async function importBackup(text: string, mode: ImportMode): Promise<ImportResult> {
  return applyBackup(parseBackup(text), mode)
}

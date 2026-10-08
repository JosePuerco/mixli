// Muss als Erstes geladen werden: stellt eine IndexedDB im Speicher bereit (Node hat keine).
import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../db/db'
import { loadDraft, saveDraft, saveIngredient } from '../db/repo'
import type { Ingredient, Mix } from '../db/types'
import type { IngredientDraft } from '../domain/ingredient'
import { base64ToBytes, bytesToBase64 } from './base64'
import { backupFileName, buildBackup, getLastBackupAt, setLastBackupAt } from './export'
import { FORMAT_VERSION, type BackupFile } from './format'
import { applyBackup, importBackup, parseBackup } from './import'
import { BackupError, migrateBackup } from './migrate'

const nutrition = { kcal: 372, kj: 1574, fat: 7, saturatedFat: 1.3, carbs: 58.7, sugar: 0.7, fiber: 10, protein: 13.5, salt: 0.01 }

const draft = (overrides: Partial<IngredientDraft> = {}): IngredientDraft => ({
  name: 'Haferflocken',
  nutrition,
  allergensContains: ['gluten'],
  allergensTraces: ['nuts'],
  tags: ['vegan'],
  ...overrides,
})

const photoBlob = (text: string) => new Blob([text], { type: 'image/webp' })
const bytesText = (data: ArrayBuffer) => new TextDecoder().decode(data)

function mixOf(ingredient: Ingredient, overrides: Partial<Mix> = {}): Mix {
  return {
    id: 'mix-1',
    name: 'Frühstück',
    forWhom: 'Lena',
    items: [
      {
        ingredientId: ingredient.id,
        grams: 300,
        snapshot: {
          name: ingredient.name,
          nutrition: ingredient.nutrition,
          allergensContains: ingredient.allergensContains,
          allergensTraces: ingredient.allergensTraces,
        },
      },
    ],
    createdAt: new Date('2026-10-01T08:00:00Z'),
    updatedAt: new Date('2026-10-01T08:00:00Z'),
    ...overrides,
  }
}

/** Backup so, wie es in der Datei stünde (über JSON, also mit allen Umwandlungen). */
async function exportText(): Promise<string> {
  return JSON.stringify(await buildBackup(new Date('2026-10-08T12:00:00Z')))
}

async function resetDb() {
  await db.delete()
  await db.open()
}

beforeEach(resetDb)

describe('base64', () => {
  it('wandelt Bytes verlustfrei hin und zurück, auch große', () => {
    const bytes = new Uint8Array(100_000).map((_, i) => i % 256)
    const back = new Uint8Array(base64ToBytes(bytesToBase64(bytes.buffer)))
    expect(back).toEqual(bytes)
  })
})

describe('backupFileName', () => {
  it('enthält das Datum', () => {
    expect(backupFileName(new Date(2026, 9, 8, 23, 59))).toBe('mixli-backup-2026-10-08.json')
  })
})

describe('Export und Import (ersetzen)', () => {
  it('bringt alle Daten inkl. Fotos unverändert zurück', async () => {
    await db.categories.add({ id: 'cat-1', name: 'Flocken', order: 0 })
    const id = await saveIngredient(draft({ categoryId: 'cat-1', brand: 'Kölln' }), { kind: 'set', blob: photoBlob('foto-1') })
    const ingredient = (await db.ingredients.get(id))!
    await db.mixes.put(mixOf(ingredient))
    await db.settings.put({ key: 'defaultFilter', value: { exclude: ['nuts'] } })

    const before = {
      categories: await db.categories.toArray(),
      ingredients: await db.ingredients.toArray(),
      mixes: await db.mixes.toArray(),
      settings: await db.settings.toArray(),
    }
    const text = await exportText()

    await resetDb()
    const result = await importBackup(text, 'replace')

    expect(result).toMatchObject({ ingredients: 1, mixes: 1, categories: 1, photos: 1, brokenRefs: 0 })
    expect(await db.categories.toArray()).toEqual(before.categories)
    expect(await db.ingredients.toArray()).toEqual(before.ingredients)
    expect(await db.mixes.toArray()).toEqual(before.mixes)
    expect(await db.settings.toArray()).toEqual(before.settings)

    const photo = (await db.photos.get(ingredient.photoId!))!
    expect(photo.type).toBe('image/webp')
    expect(bytesText(photo.data)).toBe('foto-1')
    expect(photo.createdAt).toBeInstanceOf(Date)
  })

  it('schreibt Kopf und Formatversion in die Datei', async () => {
    const file = JSON.parse(await exportText()) as BackupFile
    expect(file.app).toBe('mixli')
    expect(file.formatVersion).toBe(FORMAT_VERSION)
    expect(file.exportedAt).toBe('2026-10-08T12:00:00.000Z')
  })

  it('exportiert das Datum des letzten Backups nicht und überschreibt es beim Import nicht', async () => {
    await setLastBackupAt(new Date('2026-10-01T00:00:00Z'))
    const text = await exportText()
    expect((JSON.parse(text) as BackupFile).data.settings).toEqual([])

    await setLastBackupAt(new Date('2026-10-07T00:00:00Z'))
    await importBackup(text, 'replace')
    expect(await getLastBackupAt()).toEqual(new Date('2026-10-07T00:00:00Z'))
  })

  it('exportiert den Mix in Arbeit nicht und lässt ihn beim Import stehen', async () => {
    await saveDraft({ name: 'Halbfertig', items: [{ ingredientId: 'x', grams: 50 }] })
    const text = await exportText()
    expect((JSON.parse(text) as BackupFile).data.settings).toEqual([])

    await importBackup(text, 'replace')
    expect((await loadDraft()).name).toBe('Halbfertig')
  })

  it('ersetzt löscht alles, was nicht im Backup steht', async () => {
    const text = await exportText()
    await saveIngredient(draft({ name: 'Rosinen' }), { kind: 'set', blob: photoBlob('x') })
    await db.categories.add({ id: 'cat-x', name: 'Obst', order: 0 })

    await importBackup(text, 'replace')
    expect(await db.ingredients.count()).toBe(0)
    expect(await db.photos.count()).toBe(0)
    expect(await db.categories.count()).toBe(0)
  })

  it('nimmt nur Fotos mit, die eine Zutat benutzt, und leert kaputte Verweise', async () => {
    const id = await saveIngredient(draft({ categoryId: 'gibt-es-nicht' }), { kind: 'set', blob: photoBlob('a') })
    await db.photos.add({ id: 'verwaist', data: new TextEncoder().encode('b').buffer, type: 'image/webp', createdAt: new Date() })
    const file = JSON.parse(await exportText()) as BackupFile
    expect(file.data.photos).toHaveLength(2)

    await resetDb()
    const result = await importBackup(JSON.stringify(file), 'replace')
    expect(result.photos).toBe(1)
    expect(result.brokenRefs).toBe(1)
    expect((await db.ingredients.get(id))?.categoryId).toBeUndefined()
    expect(await db.photos.get('verwaist')).toBeUndefined()
  })
})

describe('Zusammenführen (streng über id, neuere Version gewinnt)', () => {
  async function setupBoth() {
    // Stand zum Zeitpunkt des Backups
    await db.categories.add({ id: 'cat-1', name: 'Flocken', order: 0 })
    const id = await saveIngredient(draft(), { kind: 'set', blob: photoBlob('alt') })
    const original = (await db.ingredients.get(id))!
    await db.mixes.put(mixOf(original))
    const text = await exportText()
    return { id, original, text }
  }

  it('fügt fehlende Datensätze hinzu und lässt vorhandene stehen', async () => {
    const { text } = await setupBoth()
    await resetDb()
    const other = await saveIngredient(draft({ name: 'Rosinen' }), { kind: 'keep' })

    const result = await importBackup(text, 'merge')
    expect(result).toMatchObject({ ingredients: 1, mixes: 1, categories: 1, photos: 1, keptNewer: 0 })
    expect(await db.ingredients.count()).toBe(2)
    expect(await db.ingredients.get(other)).toBeDefined()
  })

  it('behält die Zutat auf dem Gerät, wenn sie neuer ist', async () => {
    const { id, text } = await setupBoth()
    await db.ingredients.update(id, { name: 'Haferflocken (neu)', updatedAt: new Date(Date.now() + 60_000) })

    const result = await importBackup(text, 'merge')
    expect(result.keptNewer).toBe(1)
    expect(result.ingredients).toBe(0)
    expect((await db.ingredients.get(id))?.name).toBe('Haferflocken (neu)')
  })

  it('übernimmt die Zutat aus dem Backup, wenn sie dort neuer ist, und räumt das alte Foto weg', async () => {
    const { id, original } = await setupBoth()
    // Backup mit neuerer Version und neuem Foto erstellen …
    await saveIngredient(draft({ name: 'Haferflocken kernig' }), { kind: 'set', blob: photoBlob('neu') }, id)
    const newer = (await db.ingredients.get(id))!
    const text = await exportText()
    // … und auf einem Gerät mit dem alten Stand einspielen.
    await resetDb()
    await db.photos.add({ id: original.photoId!, data: new TextEncoder().encode('alt').buffer, type: 'image/webp', createdAt: new Date() })
    await db.ingredients.put(original)

    const result = await importBackup(text, 'merge')
    expect(result.ingredients).toBe(1)
    const now = (await db.ingredients.get(id))!
    expect(now.name).toBe('Haferflocken kernig')
    expect(now.photoId).toBe(newer.photoId)
    expect(bytesText((await db.photos.get(newer.photoId!))!.data)).toBe('neu')
    expect(await db.photos.get(original.photoId!)).toBeUndefined()
  })

  it('gleicht Kategorien nur über die id ab, nicht über den Namen', async () => {
    const { text } = await setupBoth()
    await resetDb()
    await db.categories.add({ id: 'cat-anders', name: 'Flocken', order: 0 })

    await importBackup(text, 'merge')
    const names = (await db.categories.toArray()).map((c) => c.name)
    expect(names).toEqual(['Flocken', 'Flocken'])
  })

  it('lässt eine Kategorie mit gleicher id auf dem Gerät unverändert', async () => {
    const { text } = await setupBoth()
    await db.categories.update('cat-1', { name: 'Getreide' })
    const result = await importBackup(text, 'merge')
    expect(result.categories).toBe(0)
    expect((await db.categories.get('cat-1'))?.name).toBe('Getreide')
  })
})

describe('Prüfung beim Import', () => {
  async function validFile(): Promise<BackupFile> {
    await db.categories.add({ id: 'cat-1', name: 'Flocken', order: 0 })
    await saveIngredient(draft(), { kind: 'set', blob: photoBlob('a') })
    return JSON.parse(await exportText()) as BackupFile
  }

  async function expectRejected(text: string, message: RegExp) {
    const before = await db.ingredients.count()
    await expect(importBackup(text, 'replace')).rejects.toThrow(message)
    await expect(importBackup(text, 'replace')).rejects.toBeInstanceOf(BackupError)
    expect(await db.ingredients.count()).toBe(before)
  }

  it('lehnt Dateien ab, die kein JSON sind', async () => {
    await expectRejected('kein json', /nicht lesen/)
  })

  it('lehnt fremde JSON-Dateien ab', async () => {
    await expectRejected(JSON.stringify({ hallo: 'welt' }), /keine Mixli-Backup-Datei/)
  })

  it('lehnt Backups aus einer neueren Version ab', async () => {
    const file = await validFile()
    await expectRejected(JSON.stringify({ ...file, formatVersion: FORMAT_VERSION + 1 }), /aktualisieren/)
  })

  it('lehnt unbekannte Allergene ab und nennt die Stelle', async () => {
    const file = await validFile()
    ;(file.data.ingredients[0].allergensContains as string[]) = ['kokos']
    await expectRejected(JSON.stringify(file), /beschädigt.*ingredients\.0\.allergensContains/)
  })

  it('lehnt negative Nährwerte, kaputtes Base64 und doppelte ids ab', async () => {
    const file = await validFile()
    const variants: BackupFile[] = [
      { ...file, data: { ...file.data, ingredients: [{ ...file.data.ingredients[0], nutrition: { ...nutrition, fat: -1 } }] } },
      { ...file, data: { ...file.data, photos: [{ ...file.data.photos[0], data: '###' }] } },
      { ...file, data: { ...file.data, categories: [file.data.categories[0], file.data.categories[0]] } },
    ]
    for (const v of variants) await expectRejected(JSON.stringify(v), /beschädigt/)
  })

  it('ignoriert unbekannte zusätzliche Felder', async () => {
    const file = await validFile()
    const parsed = parseBackup(JSON.stringify({ ...file, extra: 1, data: { ...file.data, zukunft: [] } }))
    expect(parsed.data.ingredients).toHaveLength(1)
  })

  it('schreibt nichts, wenn applyBackup unterwegs scheitert', async () => {
    const file = await validFile()
    const parsed = parseBackup(JSON.stringify(file))
    // Ungültiger Schlüssel lässt bulkPut in IndexedDB scheitern → Transaktion wird zurückgerollt.
    parsed.data.mixes = [{ ...mixOf(parsed.data.ingredients[0] as Ingredient), id: null as unknown as string }]
    await expect(applyBackup(parsed, 'replace')).rejects.toThrow()
    expect(await db.ingredients.count()).toBe(1)
    expect(await db.categories.count()).toBe(1)
  })
})

describe('migrateBackup', () => {
  it('stuft alte Formate Schritt für Schritt hoch', () => {
    const steps = {
      1: (f: { formatVersion: number } & Record<string, unknown>) => ({ ...f, formatVersion: 2, a: true }),
      2: (f: { formatVersion: number } & Record<string, unknown>) => ({ ...f, formatVersion: 3, b: true }),
    }
    expect(migrateBackup({ app: 'mixli', formatVersion: 1 }, steps, 3)).toEqual({ app: 'mixli', formatVersion: 3, a: true, b: true })
  })

  it('meldet fehlende Migrationen und ungültige Versionen', () => {
    expect(() => migrateBackup({ app: 'mixli', formatVersion: 1 }, {}, 2)).toThrow(/nicht mehr unterstützt/)
    expect(() => migrateBackup({ app: 'mixli', formatVersion: '1' })).toThrow(/Formatversion/)
  })
})

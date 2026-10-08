// Backup erstellen: alle Tabellen lesen und als JSON-Datei mit Fotos (Base64) zusammenstellen.
// Gelesen wird nur mit toArray() – Cursor scheitern in Safari 18 (siehe repo.listTags).
import { db } from '../db/db'
import type { Photo } from '../db/types'
import { bytesToBase64 } from './base64'
import { BACKUP_APP, DEVICE_SETTING_KEYS, FORMAT_VERSION, LAST_BACKUP_KEY, type BackupFile } from './format'
import { version as appVersion } from '../../package.json'

/** Bytes eines Fotos, auch aus Einträgen der ersten Phase-1-Version, die noch einen Blob haben. */
async function photoBytes(photo: Photo): Promise<ArrayBuffer | null> {
  if (photo.data) return photo.data
  return photo.blob ? photo.blob.arrayBuffer() : null
}

export async function buildBackup(now = new Date()): Promise<BackupFile> {
  // Eine Lese-Transaktion, damit alle Tabellen zum selben Zeitpunkt passen.
  const [categories, ingredients, mixes, photos, settings] = await db.transaction(
    'r',
    [db.categories, db.ingredients, db.mixes, db.photos, db.settings],
    () =>
      Promise.all([
        db.categories.toArray(),
        db.ingredients.toArray(),
        db.mixes.toArray(),
        db.photos.toArray(),
        db.settings.toArray(),
      ]),
  )

  // Erst nach der Transaktion: blob.arrayBuffer() wartet nicht auf die Datenbank.
  const photoRows: BackupFile['data']['photos'] = []
  for (const p of photos) {
    const data = await photoBytes(p)
    if (!data) continue
    photoRows.push({ id: p.id, type: p.type || p.blob?.type || 'image/jpeg', createdAt: p.createdAt.toISOString(), data: bytesToBase64(data) })
  }

  return {
    app: BACKUP_APP,
    formatVersion: FORMAT_VERSION,
    exportedAt: now.toISOString(),
    appVersion,
    data: {
      categories: categories.map(({ id, name, order }) => ({ id, name, order })),
      ingredients: ingredients.map((i) => ({
        ...i,
        createdAt: i.createdAt.toISOString(),
        updatedAt: i.updatedAt.toISOString(),
      })),
      mixes: mixes.map((m) => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
      })),
      photos: photoRows,
      settings: settings.filter((s) => !DEVICE_SETTING_KEYS.includes(s.key)),
    },
  }
}

/** z. B. „mixli-backup-2026-10-08.json“ (Datum in Ortszeit). */
export function backupFileName(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `mixli-backup-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`
}

export async function createBackupFile(now = new Date()): Promise<File> {
  const backup = await buildBackup(now)
  return new File([JSON.stringify(backup)], backupFileName(now), { type: 'application/json' })
}

export async function getLastBackupAt(): Promise<Date | null> {
  const row = await db.settings.get(LAST_BACKUP_KEY)
  return row?.value instanceof Date ? row.value : null
}

export async function setLastBackupAt(date: Date): Promise<void> {
  await db.settings.put({ key: LAST_BACKUP_KEY, value: date })
}

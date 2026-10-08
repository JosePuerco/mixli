// Stuft ältere Backup-Dateien Schritt für Schritt auf die aktuelle formatVersion hoch.
// Neue Formatversion: FORMAT_VERSION in format.ts erhöhen und hier migrations[alteVersion] ergänzen,
// die eine Datei der alten Version in die nächste umbaut (auf dem rohen JSON, vor der Zod-Prüfung).
import { BACKUP_APP, FORMAT_VERSION } from './format'

/** Fehler mit einer Meldung, die so in der Oberfläche angezeigt werden kann. */
export class BackupError extends Error {
  override name = 'BackupError'
}

type RawBackup = Record<string, unknown> & { formatVersion: number }
type Migration = (file: RawBackup) => RawBackup

/** migrations[n] macht aus Version n die Version n + 1. */
export const migrations: Record<number, Migration> = {}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function migrateBackup(
  raw: unknown,
  steps: Record<number, Migration> = migrations,
  current: number = FORMAT_VERSION,
): RawBackup {
  if (!isObject(raw) || raw.app !== BACKUP_APP) {
    throw new BackupError('Das ist keine Mixli-Backup-Datei.')
  }
  const version = raw.formatVersion
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    throw new BackupError('Die Backup-Datei hat keine gültige Formatversion.')
  }
  if (version > current) {
    throw new BackupError('Dieses Backup stammt aus einer neueren Mixli-Version. Bitte Mixli aktualisieren.')
  }

  let file = raw as RawBackup
  while (file.formatVersion < current) {
    const step = steps[file.formatVersion]
    if (!step) throw new BackupError(`Backups im Format ${file.formatVersion} werden nicht mehr unterstützt.`)
    file = step(file)
  }
  return file
}

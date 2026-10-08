// Texte und Zustand der Backup-Karte in „Mehr“ (design/DESIGN.md, Abschnitt 7).
import type { ImportResult } from './import'

/** Ab so vielen Tagen erinnert die Karte (orange) an ein neues Backup. */
export const BACKUP_REMINDER_DAYS = 14

export type BackupTone = 'ok' | 'warn' | 'neutral'

export interface BackupStatus {
  tone: BackupTone
  text: string
}

/** Ganze Kalendertage zwischen zwei Zeitpunkten in Ortszeit (Sommerzeit-fest). */
export function daysBetween(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate())
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

export function backupStatus(lastBackupAt: Date | null, hasData: boolean, now = new Date()): BackupStatus {
  if (!lastBackupAt) {
    return hasData ? { tone: 'warn', text: 'Noch kein Backup erstellt' } : { tone: 'neutral', text: 'Noch kein Backup' }
  }
  const days = Math.max(0, daysBetween(lastBackupAt, now))
  const text =
    days === 0 ? 'Letztes Backup heute' : days === 1 ? 'Letztes Backup gestern' : `Letztes Backup vor ${days} Tagen`
  return { tone: days >= BACKUP_REMINDER_DAYS ? 'warn' : 'ok', text }
}

function count(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}

/** z. B. „12 Zutaten, 3 Müslis, 4 Kategorien und 10 Fotos“. */
export function countsText(c: { ingredients: number; mixes: number; categories: number; photos: number }): string {
  const parts = [
    count(c.ingredients, 'Zutat', 'Zutaten'),
    count(c.mixes, 'Müsli', 'Müslis'),
    count(c.categories, 'Kategorie', 'Kategorien'),
    count(c.photos, 'Foto', 'Fotos'),
  ]
  return `${parts.slice(0, -1).join(', ')} und ${parts.at(-1)}`
}

/** Meldung nach dem Import. */
export function importResultText(r: ImportResult): string {
  const total = r.ingredients + r.mixes + r.categories + r.photos
  const lines = [total === 0 ? 'Import fertig: Es gab nichts Neues.' : `Import fertig: ${countsText(r)} übernommen.`]
  if (r.keptNewer > 0) {
    lines.push(
      r.keptNewer === 1
        ? '1 Eintrag war auf diesem Gerät neuer und wurde behalten.'
        : `${r.keptNewer} Einträge waren auf diesem Gerät neuer und wurden behalten.`,
    )
  }
  if (r.brokenRefs > 0) {
    lines.push(
      r.brokenRefs === 1
        ? '1 Verweis auf eine fehlende Kategorie oder ein fehlendes Foto wurde entfernt.'
        : `${r.brokenRefs} Verweise auf fehlende Kategorien oder Fotos wurden entfernt.`,
    )
  }
  return lines.join(' ')
}

// Karte „Backup“ in „Mehr“ (design/DESIGN.md, Abschnitt 7): Status (grün / orange ab 14 Tagen),
// Hinweistext, „Exportieren“ und „Importieren“.
// Export über das Teilen-Menü (iCloud Drive, Mail …), sonst als Download.
// Import: Datei wählen → prüfen → Sheet „Zusammenführen“ oder „Alles ersetzen“ (mit Rückfrage).
import { useId, useRef, useState, type ChangeEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Card, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { BottomSheet } from '../ui/BottomSheet'
import { ConfirmSheet } from '../ui/ConfirmSheet'
import { FieldError } from '../ui/FieldError'
import { db } from '../../db/db'
import { createBackupFile, getLastBackupAt, setLastBackupAt } from '../../backup/export'
import { applyBackup, backupCounts, parseBackup, type ImportMode } from '../../backup/import'
import { BackupError } from '../../backup/migrate'
import type { BackupData } from '../../backup/format'
import { backupStatus, countsText, importResultText, type BackupTone } from '../../backup/status'
import { isAbort, isShareBlocked, shareOrDownload } from '../../lib/share'

const toneClasses: Record<BackupTone, { box: string; dot: string }> = {
  ok: { box: 'bg-success-bg', dot: 'bg-accent' },
  warn: { box: 'bg-warning-bg', dot: 'bg-warning-dot' },
  neutral: { box: 'bg-surface-muted', dot: 'bg-text-placeholder' },
}

export function BackupCard() {
  const lastBackupAt = useLiveQuery(getLastBackupAt, [], null)
  const hasData = useLiveQuery(async () => (await db.ingredients.count()) > 0, [], false)
  const status = backupStatus(lastBackupAt, hasData)
  const tone = toneClasses[status.tone]

  const inputRef = useRef<HTMLInputElement>(null)
  const messageId = useId()
  const [busy, setBusy] = useState(false)
  /** Fertige Datei, falls das Teilen-Menü einen zweiten Tipp braucht (Safari, siehe exportBackup). */
  const [pending, setPending] = useState<File | null>(null)
  const [error, setError] = useState<string>()
  const [notice, setNotice] = useState<string>()
  const [backup, setBackup] = useState<BackupData | null>(null)
  const [confirmReplace, setConfirmReplace] = useState(false)

  async function share(file: File) {
    await shareOrDownload(file, 'Mixli-Backup')
    setPending(null)
    await setLastBackupAt(new Date())
    setNotice(undefined)
  }

  async function exportBackup() {
    setError(undefined)
    setNotice(undefined)
    setBusy(true)
    try {
      await share(pending ?? (await createBackupFile()))
    } catch (e) {
      if (isAbort(e)) return
      if (isShareBlocked(e) && !pending) {
        // Zusammenstellen hat zu lange gedauert: Datei bereithalten, der nächste Tipp teilt sie sofort.
        setPending(await createBackupFile())
        return
      }
      console.error(e)
      setError('Das Backup konnte nicht erstellt werden.')
    } finally {
      setBusy(false)
    }
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    // Zurücksetzen, damit dieselbe Datei noch einmal gewählt werden kann.
    e.target.value = ''
    if (!file) return
    setError(undefined)
    setNotice(undefined)
    setBusy(true)
    try {
      setBackup(parseBackup(await file.text()))
    } catch (err) {
      if (!(err instanceof BackupError)) console.error(err)
      setError(err instanceof BackupError ? err.message : 'Die Datei konnte nicht gelesen werden.')
    } finally {
      setBusy(false)
    }
  }

  async function runImport(mode: ImportMode) {
    if (!backup) return
    setConfirmReplace(false)
    setBackup(null)
    setBusy(true)
    try {
      setNotice(importResultText(await applyBackup(backup, mode)))
    } catch (err) {
      console.error(err)
      setError('Der Import ist fehlgeschlagen. Deine bisherigen Daten sind unverändert.')
    } finally {
      setBusy(false)
    }
  }

  const exportedAt = backup?.exportedAt.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <Card className="flex flex-col gap-gap-md">
      <CardTitle>Backup</CardTitle>

      <div
        className={`flex items-center gap-2.5 rounded-photo px-3.5 py-3 transition-colors duration-400 ${tone.box}`}
      >
        <span aria-hidden="true" className={`size-2.5 shrink-0 rounded-pill transition-colors duration-400 ${tone.dot}`} />
        <span className="text-sm font-semibold">{status.text}</span>
      </div>

      <p className="text-caption text-text-muted">
        Deine Daten liegen nur auf diesem Gerät. Speichere das Backup z. B. in iCloud Drive.
      </p>

      <div className="grid grid-cols-2 gap-gap-sm">
        <Button size="sm" onClick={exportBackup} disabled={busy} aria-describedby={error || notice ? messageId : undefined}>
          {pending ? 'Backup teilen' : 'Exportieren'}
        </Button>
        <Button variant="muted" size="sm" onClick={() => inputRef.current?.click()} disabled={busy}>
          Importieren
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        onChange={onFile}
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
      />

      {error && <FieldError id={messageId}>{error}</FieldError>}
      {notice && (
        <p id={messageId} role="status" className="text-caption font-semibold text-text">
          {notice}
        </p>
      )}

      <BottomSheet open={backup !== null && !confirmReplace} onClose={() => setBackup(null)} title="Backup importieren" closeLabel="Abbrechen">
        {backup && (
          <p className="px-1 text-body font-medium text-text-muted">
            Backup vom {exportedAt}: {countsText(backupCounts(backup))}.
          </p>
        )}
        <div className="flex flex-col gap-gap-sm pt-1">
          <Button variant="dark" size="md" fullWidth onClick={() => runImport('merge')}>
            Zusammenführen
          </Button>
          <p className="px-1 pb-1 text-caption text-text-muted">
            Fehlendes kommt dazu. Ist ein Eintrag auf diesem Gerät neuer, bleibt er.
          </p>
          <Button variant="muted" size="md" fullWidth onClick={() => setConfirmReplace(true)}>
            Alles ersetzen
          </Button>
        </div>
      </BottomSheet>

      <ConfirmSheet
        open={confirmReplace}
        onClose={() => setConfirmReplace(false)}
        title="Alle Daten ersetzen?"
        text="Alle Zutaten, Müslis, Kategorien und Fotos auf diesem Gerät werden gelöscht und durch das Backup ersetzt."
        confirmLabel="Ersetzen"
        onConfirm={() => runImport('replace')}
      />
    </Card>
  )
}

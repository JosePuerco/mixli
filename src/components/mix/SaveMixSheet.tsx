// Sheet „Müsli speichern“: Name (Pflicht), für wen und Notiz (optional), dann „Speichern“.
// Beim Bearbeiten sind die Felder mit den bisherigen Angaben gefüllt. Felder mit 16 px Schrift,
// sonst zoomt iOS beim Tippen hinein.
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { saveMix } from '../../db/repo'
import { NAME_MAX_LENGTH } from '../../domain/ingredientForm'
import type { MixDraft } from '../../domain/mixDraft'
import { BottomSheet } from '../ui/BottomSheet'
import { Button } from '../ui/Button'
import { FieldError } from '../ui/FieldError'

interface SaveMixSheetProps {
  open: boolean
  onClose: () => void
  draft: MixDraft
  /** Nach erfolgreichem Speichern, mit der id des Müslis. */
  onSaved: (id: string) => void
}

export function SaveMixSheet({ open, onClose, draft, onSaved }: SaveMixSheetProps) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={draft.mixId ? 'Änderungen speichern' : 'Müsli speichern'}
      closeLabel="Abbrechen"
    >
      {/* Nur bei offenem Sheet aufbauen: So startet das Formular jedes Mal mit den aktuellen Angaben. */}
      {open && <SaveMixForm draft={draft} onSaved={onSaved} />}
    </BottomSheet>
  )
}

const fieldClasses =
  'w-full bg-transparent py-1 text-body-large font-semibold text-text outline-none placeholder:text-text-placeholder'

function SaveMixForm({ draft, onSaved }: { draft: MixDraft; onSaved: (id: string) => void }) {
  const [name, setName] = useState(draft.name)
  const [forWhom, setForWhom] = useState(draft.forWhom ?? '')
  const [note, setNote] = useState(draft.note ?? '')
  const [nameError, setNameError] = useState<string>()
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)
  const nameErrorId = useId()
  const errorId = useId()

  // Neues Müsli: gleich ins Namensfeld. Im nächsten Frame, weil das Sheet zuerst sich selbst fokussiert.
  useEffect(() => {
    if (draft.name) return
    const frame = requestAnimationFrame(() => nameRef.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [draft.name])

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    if (!name.trim()) {
      setNameError('Bitte einen Namen eingeben')
      nameRef.current?.focus()
      return
    }
    setBusy(true)
    setError(undefined)
    try {
      onSaved(await saveMix({ ...draft, name, forWhom, note }))
    } catch (err) {
      console.error(err)
      const message = err instanceof Error ? err.message : ''
      setError(
        message === 'Müsli nicht gefunden'
          ? 'Dieses Müsli gibt es nicht mehr, es wurde inzwischen gelöscht.'
          : 'Speichern hat nicht geklappt. Bitte versuch es noch einmal.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-gap-md" noValidate>
      <div className="rounded-card bg-surface-muted px-gap-lg py-1.5">
        <label className="flex flex-col gap-0.5 border-b border-border py-2.5">
          <span className="text-caption font-semibold text-text-muted">Name</span>
          <input
            ref={nameRef}
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setNameError(undefined)
            }}
            placeholder="z. B. Frühstück Basic"
            maxLength={NAME_MAX_LENGTH}
            autoComplete="off"
            enterKeyHint="next"
            aria-invalid={nameError ? true : undefined}
            aria-describedby={nameError ? nameErrorId : undefined}
            className={fieldClasses}
          />
          {nameError && (
            <FieldError id={nameErrorId} className="pb-1">
              {nameError}
            </FieldError>
          )}
        </label>
        <label className="flex flex-col gap-0.5 border-b border-border py-2.5">
          <span className="text-caption font-semibold text-text-muted">Für wen (optional)</span>
          <input
            type="text"
            value={forWhom}
            onChange={(e) => setForWhom(e.target.value)}
            placeholder="z. B. Lena"
            maxLength={NAME_MAX_LENGTH}
            autoComplete="off"
            enterKeyHint="next"
            className={fieldClasses}
          />
        </label>
        <label className="flex flex-col gap-0.5 py-2.5">
          <span className="text-caption font-semibold text-text-muted">Notiz (optional)</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="z. B. mit Haferdrink"
            rows={2}
            maxLength={500}
            className={`${fieldClasses} resize-none`}
          />
        </label>
      </div>

      {error && (
        <FieldError id={errorId} className="px-1">
          {error}
        </FieldError>
      )}

      <Button type="submit" fullWidth disabled={busy} aria-describedby={error ? errorId : undefined}>
        Speichern
      </Button>
    </form>
  )
}

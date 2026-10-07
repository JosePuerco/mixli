// Sheet mit einem Textfeld, z. B. „Neue Kategorie“ oder „Neuer Tag“.
// Feld wie im Einstellungen-Prototyp (grau, 44 px, Pille), aber 16 px Schrift: darunter zoomt iOS beim Tippen hinein.
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { BottomSheet } from './BottomSheet'
import { Button } from './Button'
import { FieldError } from './FieldError'

interface TextInputSheetProps {
  open: boolean
  onClose: () => void
  title: string
  placeholder: string
  submitLabel?: string
  maxLength?: number
  /** Gibt eine Fehlermeldung zurück, wenn der Wert nicht passt; sonst schließt das Sheet. */
  onSubmit: (value: string) => Promise<string | undefined> | string | undefined
}

export function TextInputSheet({
  open,
  onClose,
  title,
  placeholder,
  submitLabel = 'Hinzufügen',
  maxLength = 40,
  onSubmit,
}: TextInputSheetProps) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const errorId = useId()

  // Beim Öffnen leeren und ins Feld springen (läuft nach dem Fokus des Sheets selbst).
  useEffect(() => {
    if (!open) return
    setValue('')
    setError(undefined)
    inputRef.current?.focus()
  }, [open])

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    if (!value.trim()) {
      setError('Bitte einen Namen eingeben')
      return
    }
    setBusy(true)
    try {
      const problem = await onSubmit(value)
      if (problem) setError(problem)
      else onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={title} closeLabel="Abbrechen">
      <form onSubmit={submit} className="flex flex-col gap-gap-sm">
        <div className="flex gap-gap-sm">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              setError(undefined)
            }}
            placeholder={placeholder}
            aria-label={title}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            maxLength={maxLength}
            enterKeyHint="done"
            autoComplete="off"
            className="h-11 min-w-0 flex-1 rounded-input bg-surface-muted px-4 text-body-large font-medium text-text outline-none placeholder:text-text-placeholder"
          />
          <Button type="submit" variant="dark" size="xs" disabled={busy}>
            {submitLabel}
          </Button>
        </div>
        {error && (
          <FieldError id={errorId} className="px-1">
            {error}
          </FieldError>
        )}
      </form>
    </BottomSheet>
  )
}

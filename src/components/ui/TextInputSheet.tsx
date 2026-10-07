// Sheet mit einem Textfeld, z. B. „Neue Kategorie“ oder „Kategorie umbenennen“.
// Feld wie im Einstellungen-Prototyp (grau, 44 px, Pille), aber 16 px Schrift: darunter zoomt iOS beim Tippen hinein.
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { BottomSheet } from './BottomSheet'
import { Button } from './Button'
import { FieldError } from './FieldError'

type SubmitHandler = (value: string) => Promise<string | undefined> | string | undefined

interface TextInputSheetProps {
  open: boolean
  onClose: () => void
  title: string
  placeholder: string
  submitLabel?: string
  maxLength?: number
  /** Startwert beim Öffnen, z. B. der bisherige Name beim Umbenennen (wird markiert). */
  initialValue?: string
  /** Gibt eine Fehlermeldung zurück, wenn der Wert nicht passt; sonst schließt das Sheet. */
  onSubmit: SubmitHandler
}

export function TextInputSheet({ open, onClose, title, ...formProps }: TextInputSheetProps) {
  // Das Formular wird nur bei offenem Sheet aufgebaut – so startet es bei jedem Öffnen frisch
  // mit dem Startwert, ohne ihn nachträglich setzen zu müssen.
  return (
    <BottomSheet open={open} onClose={onClose} title={title} closeLabel="Abbrechen">
      <TextInputForm label={title} onClose={onClose} {...formProps} />
    </BottomSheet>
  )
}

interface TextInputFormProps {
  label: string
  onClose: () => void
  placeholder: string
  submitLabel?: string
  maxLength?: number
  initialValue?: string
  onSubmit: SubmitHandler
}

function TextInputForm({
  label,
  onClose,
  placeholder,
  submitLabel = 'Hinzufügen',
  maxLength = 40,
  initialValue = '',
  onSubmit,
}: TextInputFormProps) {
  const [value, setValue] = useState(initialValue)
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const errorId = useId()

  // Ins Feld springen und den Startwert markieren (Tippen ersetzt ihn dann).
  // Im nächsten Frame, weil das Sheet beim Öffnen zuerst sich selbst fokussiert.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
    return () => cancelAnimationFrame(frame)
  }, [])

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
          aria-label={label}
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
  )
}

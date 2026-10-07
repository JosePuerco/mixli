// Schritt „Foto“: große Fläche (320 px), Buttons „Kamera“ und „Galerie“, Häkchen nach der Aufnahme.
// Kamera: <input capture="environment"> öffnet auf dem Handy direkt die Rückkamera, Galerie ohne capture.
// Das Foto wird sofort verkleinert; gespeichert wird erst mit der Zutat.
import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Button } from '../ui/Button'
import { IconButton } from '../ui/IconButton'
import { PhotoView } from '../ui/PhotoView'
import { IconCamera, IconCheck, IconClose } from '../icons/Icons'
import { popIn } from '../../design/motion'
import { resizePhoto } from '../../lib/image'

interface PhotoPickerProps {
  photo: Blob | null
  onChange: (photo: Blob | null) => void
  /** Meldet, solange ein Foto verkleinert wird (dann z. B. „Weiter“ sperren). */
  onBusyChange?: (busy: boolean) => void
}

/** So lange bleibt die Bestätigung „Foto übernommen“ stehen. */
const CONFIRM_MS = 1400

export function PhotoPicker({ photo, onChange, onBusyChange }: PhotoPickerProps) {
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const [confirmed, setConfirmed] = useState(false)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (!confirmed) return
    const t = setTimeout(() => setConfirmed(false), CONFIRM_MS)
    return () => clearTimeout(t)
  }, [confirmed])

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    // Zurücksetzen, damit dasselbe Foto noch einmal gewählt werden kann.
    e.target.value = ''
    if (!file) return
    setError(undefined)
    setBusy(true)
    onBusyChange?.(true)
    try {
      onChange(await resizePhoto(file))
      setConfirmed(true)
    } catch {
      setError('Das Foto konnte nicht gelesen werden. Bitte ein anderes wählen.')
    } finally {
      setBusy(false)
      onBusyChange?.(false)
    }
  }

  return (
    <div className="flex flex-col gap-gap-lg">
      <div className="relative flex h-80 flex-col items-center justify-center gap-2.5 overflow-hidden rounded-sheet bg-photo-1 text-sm font-semibold text-text-muted">
        {photo ? (
          <PhotoView blob={photo} alt="Foto der Zutat" className="absolute inset-0" />
        ) : (
          <>
            <IconCamera size={40} />
            {busy ? 'Foto wird vorbereitet …' : 'Noch kein Foto'}
          </>
        )}

        <AnimatePresence>
          {confirmed && photo && (
            <motion.div
              {...(reduceMotion ? {} : popIn())}
              role="status"
              className="relative flex flex-col items-center gap-2.5"
            >
              <span className="flex size-14 items-center justify-center rounded-pill bg-accent text-on-accent">
                <IconCheck size={26} strokeWidth={2.2} />
              </span>
              <span className="rounded-pill bg-surface px-3 py-1 text-label text-text">Foto übernommen</span>
            </motion.div>
          )}
        </AnimatePresence>

        {photo && (
          <IconButton aria-label="Foto entfernen" onClick={() => onChange(null)} className="absolute top-3 right-3">
            <IconClose size={20} strokeWidth={1.8} />
          </IconButton>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Button variant="surface" size="md" disabled={busy} onClick={() => cameraRef.current?.click()}>
          Kamera
        </Button>
        <Button variant="surface" size="md" disabled={busy} onClick={() => galleryRef.current?.click()}>
          Galerie
        </Button>
      </div>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={onFile} />
      <input ref={galleryRef} type="file" accept="image/*" hidden onChange={onFile} />

      {error ? (
        <p role="alert" className="text-center text-caption font-semibold text-text">
          {error}
        </p>
      ) : (
        <p className="text-center text-caption text-text-muted">
          Das Foto wird verkleinert und nur auf diesem Gerät gespeichert.
        </p>
      )}
    </div>
  )
}

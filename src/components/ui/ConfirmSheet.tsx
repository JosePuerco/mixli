// Rückfrage als Bottom-Sheet (statt Popup), z. B. „Zutat verwerfen?“.
// Es gibt keine Warnfarbe für Buttons: Die bestätigende Aktion ist dunkel, Abbrechen grau.
import { BottomSheet } from './BottomSheet'
import { Button } from './Button'

interface ConfirmSheetProps {
  open: boolean
  onClose: () => void
  title: string
  text: string
  confirmLabel: string
  cancelLabel?: string
  onConfirm: () => void
}

export function ConfirmSheet({
  open,
  onClose,
  title,
  text,
  confirmLabel,
  cancelLabel = 'Abbrechen',
  onConfirm,
}: ConfirmSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title={title} closeLabel={cancelLabel}>
      <p className="px-1 text-body font-medium text-text-muted">{text}</p>
      <div className="flex flex-col gap-gap-sm pt-1">
        <Button variant="dark" size="md" fullWidth onClick={onConfirm}>
          {confirmLabel}
        </Button>
        <Button variant="muted" size="md" fullWidth onClick={onClose}>
          {cancelLabel}
        </Button>
      </div>
    </BottomSheet>
  )
}

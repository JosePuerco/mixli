// Kopf des Ablaufs „Zutat anlegen“: Schließen (Schritt 1) bzw. Zurück, „Schritt n von 4 · Name“,
// darunter der Fortschrittsbalken aus 4 Teilen, die sich weich einfärben.
import { IconButton } from '../ui/IconButton'
import { IconBack, IconClose } from '../icons/Icons'

interface WizardHeaderProps {
  /** 0-basiert. */
  step: number
  stepNames: readonly string[]
  onClose: () => void
  onBack: () => void
}

export function WizardHeader({ step, stepNames, onClose, onBack }: WizardHeaderProps) {
  const total = stepNames.length
  return (
    <>
      <div className="flex items-center justify-between">
        {step === 0 ? (
          <IconButton aria-label="Abbrechen" onClick={onClose}>
            <IconClose size={20} strokeWidth={1.8} />
          </IconButton>
        ) : (
          <IconButton aria-label="Zurück" onClick={onBack}>
            <IconBack size={20} strokeWidth={1.8} />
          </IconButton>
        )}
        <span className="text-label font-semibold text-text-muted" aria-live="polite">
          Schritt {step + 1} von {total} · {stepNames[step]}
        </span>
        <span className="w-11" aria-hidden="true" />
      </div>
      <div
        role="progressbar"
        aria-label="Fortschritt"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={step + 1}
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
      >
        {stepNames.map((name, i) => (
          <span
            key={name}
            className={`h-1 rounded-sm transition-colors duration-350 ${i <= step ? 'bg-accent' : 'bg-border'}`}
          />
        ))}
      </div>
    </>
  )
}

// Schalter (an/aus) als ganze Zeile: Beschriftung links, Schiene rechts. Die ganze Zeile ist die Tippfläche (≥ 44 px).
// An: Schiene in Akzentfarbe, Knopf rechts. Aus: Schiene in Rahmenfarbe, Knopf links.
import { motion, useReducedMotion } from 'motion/react'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  /** Kleine Erklärung unter der Beschriftung. */
  hint?: string
  disabled?: boolean
}

export function Switch({ checked, onChange, label, hint, disabled = false }: SwitchProps) {
  const reduceMotion = useReducedMotion()
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex min-h-touch w-full items-center justify-between gap-gap-md text-left disabled:opacity-35"
    >
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-body">{label}</span>
        {hint && <span className="text-caption text-text-muted">{hint}</span>}
      </span>
      <span
        className={`flex h-7.75 w-12.75 shrink-0 items-center rounded-pill p-0.5 transition-colors ${checked ? 'justify-end bg-accent' : 'justify-start bg-border'}`}
        aria-hidden="true"
      >
        <motion.span
          layout={!reduceMotion}
          transition={{ type: 'spring', stiffness: 700, damping: 40 }}
          className="size-6.75 rounded-pill bg-surface"
        />
      </span>
    </button>
  )
}

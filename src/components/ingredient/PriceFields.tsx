// Preis der Zutat (Pflicht): Umschalter „Packung | pro 100 g“, darunter eine Karte im Stil der Nährwerte
// (Label links, Feld rechtsbündig mit Einheit). Der Preis erscheint nur in der App, nie auf dem Etikett.
import { useId } from 'react'
import { FieldError } from '../ui/FieldError'
import { SegmentedControl } from '../ui/Chip'
import { PRICE_KINDS, type PriceErrors, type PriceInput } from '../../domain/price'

interface PriceFieldsProps {
  value: PriceInput
  onChange: (value: PriceInput) => void
  errors?: PriceErrors
}

export function PriceFields({ value, onChange, errors = {} }: PriceFieldsProps) {
  const headingId = useId()
  const eurosId = useId()
  const gramsId = useId()
  const pkg = value.kind === 'package'

  return (
    <section className="flex flex-col gap-2.5" aria-labelledby={headingId}>
      <div className="flex items-center justify-between gap-gap-md px-1">
        <h2 id={headingId} className="text-label">
          Preis
        </h2>
        <SegmentedControl
          aria-label="Preis angeben"
          options={PRICE_KINDS}
          value={value.kind}
          onChange={(kind) => onChange({ ...value, kind })}
        />
      </div>
      <div className="rounded-card bg-surface px-gap-lg py-1">
        <Row
          id={eurosId}
          label={pkg ? 'Preis der Packung' : 'Preis pro 100 g'}
          unit="€"
          value={value.euros}
          placeholder={pkg ? 'z. B. 2,49' : 'z. B. 0,50'}
          onChange={(euros) => onChange({ ...value, euros })}
          error={errors.euros}
          divider={pkg}
        />
        {pkg && (
          <Row
            id={gramsId}
            label="Packungsgröße"
            unit="g"
            value={value.grams}
            placeholder="z. B. 500"
            onChange={(grams) => onChange({ ...value, grams })}
            error={errors.grams}
          />
        )}
      </div>
      <p className="px-1 text-caption text-text-muted">Nur für dich, steht nicht auf dem Etikett.</p>
    </section>
  )
}

interface RowProps {
  id: string
  label: string
  unit: string
  value: string
  placeholder: string
  onChange: (value: string) => void
  error?: string
  divider?: boolean
}

function Row({ id, label, unit, value, placeholder, onChange, error, divider }: RowProps) {
  return (
    <div className={`flex flex-col ${divider ? 'border-b border-divider' : ''}`}>
      <div className="flex min-h-12 items-center gap-gap-sm">
        <label htmlFor={id} className="flex-1 text-body text-text">
          {label}
        </label>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="w-24 bg-transparent text-right text-body-large font-bold text-text outline-none placeholder:font-semibold placeholder:text-text-placeholder"
        />
        <span aria-hidden="true" className="w-8 text-label font-medium text-text-muted">
          {unit}
        </span>
      </div>
      {error && (
        <FieldError id={`${id}-error`} className="justify-end pr-10 pb-2.5">
          {error}
        </FieldError>
      )}
    </div>
  )
}

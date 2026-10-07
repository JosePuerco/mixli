// Schritt „Nährwerte“: eine Karte, 9 Zeilen (Label links, Feld rechtsbündig mit Einheit).
// „davon“-Zeilen eingerückt und gedämpft. kJ zeigt den aus kcal berechneten Wert als Vorschlag.
import { useId } from 'react'
import { FieldError } from '../ui/FieldError'
import { formatNumber } from '../../lib/format'
import { parseDecimal } from '../../lib/parse'
import {
  NUTRIENT_FIELDS,
  kcalToKj,
  type NutrientKey,
  type NutritionErrors,
  type NutritionInput,
} from '../../domain/nutrition'

interface NutritionFieldsProps {
  values: NutritionInput
  onChange: (key: NutrientKey, value: string) => void
  errors?: NutritionErrors
}

/** id des Eingabefelds, z. B. zum Fokussieren des ersten Fehlers. */
export function nutrientInputId(prefix: string, key: NutrientKey) {
  return `${prefix}-${key}`
}

export function NutritionFields({ values, onChange, errors = {} }: NutritionFieldsProps) {
  const prefix = useId()
  const kcal = parseDecimal(values.kcal)
  const kjSuggestion = kcal !== undefined && Number.isFinite(kcal) ? formatNumber(Math.round(kcalToKj(kcal))) : 'auto'

  return (
    <div className="rounded-card bg-surface px-gap-lg py-1">
      {NUTRIENT_FIELDS.map((f) => {
        const id = nutrientInputId(prefix, f.key)
        const error = errors[f.key]
        return (
          <div key={f.key} className="flex flex-col border-b border-divider last:border-b-0">
            <div className="flex min-h-12 items-center gap-gap-sm">
              <label
                htmlFor={id}
                className={`flex-1 ${f.sub ? 'pl-3.5 text-body font-medium text-text-muted' : 'text-body text-text'}`}
              >
                {f.label}
                {/* Beide Energie-Zeilen heißen „Energie“ – für Screenreader die Einheit dazu. */}
                {f.unit !== 'g' && <span className="sr-only"> in {f.unit}</span>}
              </label>
              <input
                id={id}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={values[f.key]}
                onChange={(e) => onChange(f.key, e.target.value)}
                placeholder={f.key === 'kj' ? kjSuggestion : '–'}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${id}-error` : undefined}
                className="w-18 bg-transparent text-right text-body-large font-bold text-text outline-none placeholder:font-semibold placeholder:text-text-placeholder"
              />
              <span aria-hidden="true" className="w-8 text-label font-medium text-text-muted">
                {f.unit}
              </span>
            </div>
            {error && (
              <FieldError id={`${id}-error`} className="justify-end pr-10 pb-2.5">
                {error}
              </FieldError>
            )}
          </div>
        )
      })}
    </div>
  )
}

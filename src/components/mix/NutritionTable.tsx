// Volle Nährwerttabelle pro 100 g, gerundet wie auf Etiketten: Energie in einer Zeile (kJ / kcal),
// danach die Pflichtwerte, „davon“-Zeilen eingerückt und gedämpft.
import type { Nutrition } from '../../db/types'
import { NUTRIENT_FIELDS } from '../../domain/nutrition'
import { formatNutrient } from '../../domain/rounding'

const rows = NUTRIENT_FIELDS.filter((f) => f.unit === 'g')

export function NutritionTable({ nutrition }: { nutrition: Nutrition }) {
  return (
    <dl className="flex flex-col text-sm">
      <div className="flex justify-between gap-gap-md border-b border-divider py-1.75">
        <dt className="font-semibold">Energie</dt>
        <dd className="font-bold">
          {formatNutrient('kj', nutrition.kj)} / {formatNutrient('kcal', nutrition.kcal)}
        </dd>
      </div>
      {rows.map((f, i) => (
        <div
          key={f.key}
          className={`flex justify-between gap-gap-md py-1.75 ${i < rows.length - 1 ? 'border-b border-divider' : ''} ${
            f.sub ? 'pl-3.5 text-text-muted' : ''
          }`}
        >
          <dt className={f.sub ? 'font-medium' : 'font-semibold'}>{f.label}</dt>
          <dd className="font-bold text-text">{formatNutrient(f.key, nutrition[f.key])}</dd>
        </div>
      ))}
    </dl>
  )
}

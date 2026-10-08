// Übersichtskarte im Mixen-Screen: Ring links, rechts kcal groß und Eiweiß, Kohlenhydrate, Fett – pro 100 g, gerundet.
import type { Nutrition } from '../../db/types'
import { formatNutrient, roundNutrient } from '../../domain/rounding'
import { formatNumber } from '../../lib/format'
import { Card } from '../ui/Card'
import { MixRing } from './MixRing'

interface MixSummaryCardProps {
  shares: readonly number[]
  keys: readonly string[]
  total: number
  nutrition: Nutrition
}

const ROWS = [
  { key: 'protein', label: 'Eiweiß' },
  { key: 'carbs', label: 'Kohlenhydrate' },
  { key: 'fat', label: 'Fett' },
] as const

export function MixSummaryCard({ shares, keys, total, nutrition }: MixSummaryCardProps) {
  const kcal = roundNutrient('kcal', nutrition.kcal)
  return (
    <Card className="flex items-center gap-gap-lg">
      <MixRing shares={shares} keys={keys} total={total} />
      <div className="flex min-w-0 flex-1 flex-col gap-gap-sm">
        <p className="flex items-baseline gap-1.5">
          <span className="text-stat-large">{kcal.kind === 'value' ? formatNumber(kcal.value) : '0'}</span>
          <span className="text-label font-normal text-text-muted">kcal / 100 g</span>
        </p>
        <dl className="flex flex-col gap-gap-sm text-label font-normal">
          {ROWS.map((r) => (
            <div key={r.key} className="flex justify-between gap-gap-sm">
              <dt className="text-text-muted">{r.label}</dt>
              <dd className="font-semibold">{formatNutrient(r.key, nutrition[r.key])}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Card>
  )
}

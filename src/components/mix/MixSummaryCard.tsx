// Übersichtskarte im Mixen-Screen: Ring links, rechts kcal groß und Eiweiß, Kohlenhydrate, Fett – pro 100 g, gerundet.
// Die Zahlen zählen bei Änderungen zum neuen Wert.
import type { Nutrition } from '../../db/types'
import { formatNutrient, roundNutrient } from '../../domain/rounding'
import { formatNumber } from '../../lib/format'
import { AnimatedNumber } from '../ui/AnimatedNumber'
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

function formatKcal(value: number): string {
  const kcal = roundNutrient('kcal', value)
  return kcal.kind === 'value' ? formatNumber(kcal.value) : '0'
}

export function MixSummaryCard({ shares, keys, total, nutrition }: MixSummaryCardProps) {
  return (
    <Card className="flex items-center gap-gap-lg">
      <MixRing shares={shares} keys={keys} total={total} />
      <div className="flex min-w-0 flex-1 flex-col gap-gap-sm">
        <p className="flex items-baseline gap-1.5">
          <AnimatedNumber className="text-stat-large" value={nutrition.kcal} format={formatKcal} />
          <span className="text-label font-normal text-text-muted">kcal / 100 g</span>
        </p>
        <dl className="flex flex-col gap-gap-sm text-label font-normal">
          {ROWS.map((r) => (
            <div key={r.key} className="flex justify-between gap-gap-sm">
              <dt className="text-text-muted">{r.label}</dt>
              <dd className="font-semibold">
                <AnimatedNumber value={nutrition[r.key]} format={(v) => formatNutrient(r.key, v)} />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </Card>
  )
}

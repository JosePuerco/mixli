// Anzeige-Rundung wie auf Supermarkt-Etiketten (EU-Leitfaden 2012, Tabelle „Rundung“ in PLAN.md).
// Gerechnet wird überall exakt; nur diese Funktionen runden, und nur für die Anzeige.
import { NBSP, formatNumber, formatWithUnit } from '../lib/format'
import { NUTRIENT_FIELDS, type NutrientKey } from './nutrition'

/**
 * Entfernt Gleitkomma-Rauschen (0,1 + 0,2 = 0,30000000000000004; 1,15 × 10 = 11,499999999999998),
 * damit Grenzen wie „bis 0,5 g“ und das Aufrunden bei ,5 zuverlässig greifen.
 */
export function clean(x: number): number {
  return Number(x.toPrecision(12))
}

/** Kaufmännisch runden (,5 nach oben) auf die angegebenen Nachkommastellen. */
export function roundHalfUp(x: number, decimals: number): number {
  const f = 10 ** decimals
  return Math.round(clean(x * f)) / f
}

/** Ergebnis der Rundung: ein Wert mit fester Stellenzahl oder „kleiner als“ eine Grenze. */
export type RoundedNutrient =
  | { kind: 'value'; value: number; decimals: number }
  | { kind: 'below'; limit: number; decimals: number }

/** Fett, Kohlenhydrate, Zucker, Ballaststoffe, Eiweiß, gesättigte Fettsäuren. */
function roundGrams(v: number, limit: number): RoundedNutrient {
  const x = clean(v)
  if (x <= limit) return { kind: 'below', limit, decimals: 1 }
  const tenth = roundHalfUp(x, 1)
  // 9,96 g wird auf 0,1 g gerundet zu 10,0 – ab 10 g gilt aber „ganzzahlig“, also „10 g“.
  if (tenth >= 10) return { kind: 'value', value: roundHalfUp(x, 0), decimals: 0 }
  return { kind: 'value', value: tenth, decimals: 1 }
}

function roundSalt(v: number): RoundedNutrient {
  const x = clean(v)
  if (x <= 0.0125) return { kind: 'below', limit: 0.01, decimals: 2 }
  const hundredth = roundHalfUp(x, 2)
  // 0,996 g wird auf 0,01 g gerundet zu 1,00 – ab 1 g gilt „auf 0,1 g“, also „1,0 g“.
  if (hundredth >= 1) return { kind: 'value', value: roundHalfUp(x, 1), decimals: 1 }
  return { kind: 'value', value: hundredth, decimals: 2 }
}

/** Rundet einen Nährwert pro 100 g nach der Regel für sein Feld. */
export function roundNutrient(key: NutrientKey, value: number): RoundedNutrient {
  switch (key) {
    case 'kj':
    case 'kcal':
      return { kind: 'value', value: roundHalfUp(clean(value), 0), decimals: 0 }
    case 'saturatedFat':
      return roundGrams(value, 0.1)
    case 'salt':
      return roundSalt(value)
    default:
      return roundGrams(value, 0.5)
  }
}

const unitOf = (key: NutrientKey) => NUTRIENT_FIELDS.find((f) => f.key === key)!.unit

/** Fertiger Anzeigetext, z. B. „14 g“, „7,8 g“, „<0,5 g“, „0,02 g“, „399 kcal“. */
export function formatNutrient(key: NutrientKey, value: number): string {
  const r = roundNutrient(key, value)
  const unit = unitOf(key)
  if (r.kind === 'below') return `<${formatNumber(r.limit, r.decimals)}${NBSP}${unit}`
  return formatWithUnit(r.value, unit, r.decimals)
}

/** Anteil (0–1) als ganze Prozent: „75 %“. Kleine Anteile über 0 nie als „0 %“, sondern „<1 %“. */
export function formatShare(share: number): string {
  const pct = roundHalfUp(share * 100, 0)
  if (pct === 0 && clean(share) > 0) return `<1${NBSP}%`
  return formatWithUnit(pct, '%')
}

/** Grammzahl wie eingegeben: ganze Gramm ohne Komma („50 g“), sonst eine Nachkommastelle („12,5 g“). */
export function formatGrams(grams: number): string {
  const g = roundHalfUp(grams, 1)
  return formatWithUnit(g, 'g', Number.isInteger(g) ? 0 : 1)
}

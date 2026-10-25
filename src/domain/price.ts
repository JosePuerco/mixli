// Preise der Zutaten und des Mixes. Nur für den Nutzer der App, nie auf dem Etikett.
// Gespeichert wird die Eingabe so, wie sie gemacht wurde (Packung oder pro 100 g); gerechnet wird exakt
// in Euro pro Gramm, gerundet erst bei der Anzeige auf Cent.
import { z } from 'zod'
import { formatWithUnit } from '../lib/format'
import { parseDecimal, toDecimalInput } from '../lib/parse'
import type { MixLine } from './mix'
import { roundHalfUp } from './rounding'

export type Price =
  /** z. B. 2,49 € für 500 g, wie auf dem Kassenbon. */
  | { kind: 'package'; euros: number; grams: number }
  /** z. B. 0,50 € pro 100 g, wie am Regal. */
  | { kind: 'per100g'; euros: number }

export type PriceKind = Price['kind']

export const PRICE_KINDS: { value: PriceKind; label: string }[] = [
  { value: 'package', label: 'Packung' },
  { value: 'per100g', label: 'pro 100 g' },
]

export const MAX_EUROS = 9999.99
export const MAX_PACKAGE_GRAMS = 99999

/** Gültiger Preis. Auch für den Backup-Import und den Mix in Arbeit. */
export const priceSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('package'), euros: z.number().min(0).max(MAX_EUROS), grams: z.number().positive().max(MAX_PACKAGE_GRAMS) }),
  z.object({ kind: z.literal('per100g'), euros: z.number().min(0).max(MAX_EUROS) }),
])

export function eurosPerGram(p: Price): number {
  return p.kind === 'package' ? p.euros / p.grams : p.euros / 100
}

// ---------- Formular ----------

/** Formularwerte als Text, so wie getippt. Die Packungsgröße zählt nur bei „Packung“. */
export interface PriceInput {
  kind: PriceKind
  euros: string
  grams: string
}

export interface PriceErrors {
  euros?: string
  grams?: string
}

export type PriceResult = { ok: true; value: Price } | { ok: false; errors: PriceErrors }

export function emptyPriceInput(): PriceInput {
  return { kind: 'package', euros: '', grams: '' }
}

export function priceToInput(p: Price | undefined): PriceInput {
  if (!p) return emptyPriceInput()
  return { kind: p.kind, euros: toDecimalInput(p.euros), grams: p.kind === 'package' ? toDecimalInput(p.grams) : '' }
}

export function hasPriceInput(i: PriceInput): boolean {
  return i.euros.trim() !== '' || (i.kind === 'package' && i.grams.trim() !== '')
}

function checkEuros(input: string): string | undefined {
  const v = parseDecimal(input)
  if (v === undefined) return 'Bitte einen Preis eingeben'
  if (Number.isNaN(v)) return 'Keine gültige Zahl'
  if (v < 0) return 'Darf nicht negativ sein'
  if (v > MAX_EUROS) return 'Höchstens 9999,99 €'
  return undefined
}

function checkGrams(input: string): string | undefined {
  const v = parseDecimal(input)
  if (v === undefined) return 'Bitte die Packungsgröße eingeben'
  if (Number.isNaN(v)) return 'Keine gültige Zahl'
  if (v <= 0) return 'Muss größer als 0 sein'
  if (v > MAX_PACKAGE_GRAMS) return `Höchstens ${MAX_PACKAGE_GRAMS} g`
  return undefined
}

/** Prüft die Eingabe. Der Preis ist Pflicht. */
export function parsePriceInput(i: PriceInput): PriceResult {
  const errors: PriceErrors = { euros: checkEuros(i.euros), grams: i.kind === 'package' ? checkGrams(i.grams) : undefined }
  if (errors.euros || errors.grams) {
    return { ok: false, errors: Object.fromEntries(Object.entries(errors).filter(([, e]) => e)) }
  }
  const euros = parseDecimal(i.euros)!
  return {
    ok: true,
    value: i.kind === 'package' ? { kind: 'package', euros, grams: parseDecimal(i.grams)! } : { kind: 'per100g', euros },
  }
}

// ---------- Mix ----------

export type MixPrice =
  | { complete: true; total: number; perKg: number }
  /** Mindestens eine Zeile ohne Preis (z. B. Müsli von vor den Preisen): keine Summe, sondern die Namen. */
  | { complete: false; missing: string[] }

/** Preis des Mixes aus den Snapshots. null, solange der Mix leer ist. */
export function mixPrice(items: readonly MixLine[]): MixPrice | null {
  const lines = items.filter((i) => i.grams > 0)
  if (lines.length === 0) return null
  const missing = lines.filter((l) => !l.snapshot.price).map((l) => l.snapshot.name)
  if (missing.length > 0) return { complete: false, missing }
  const grams = lines.reduce((sum, l) => sum + l.grams, 0)
  const total = lines.reduce((sum, l) => sum + eurosPerGram(l.snapshot.price!) * l.grams, 0)
  return { complete: true, total, perKg: (total / grams) * 1000 }
}

// ---------- Anzeige ----------

/** „1,87 €“ – auf Cent, kaufmännisch gerundet. */
export function formatEuros(value: number): string {
  return formatWithUnit(roundHalfUp(value, 2), '€', 2)
}

/** „4,67 €/kg“ */
export function formatEurosPerKg(value: number): string {
  return formatWithUnit(roundHalfUp(value, 2), '€/kg', 2)
}

// Der Mix in Arbeit (Mixen-Screen): Zutaten mit Mengen, dazu Name, für wen und Notiz fürs Speichern.
// Reine Funktionen; gespeichert wird der Entwurf in repo.ts, damit er Tab-Wechsel und App-Neustart übersteht.
import { z } from 'zod'
import type { Ingredient, IngredientSnapshot, Mix } from '../db/types'
import { ALLERGENS } from './allergens'
import { DEFAULT_GRAMS, normalizeGrams, snapshotOf, stepGrams, type MixLine } from './mix'

export interface DraftItem {
  ingredientId: string
  grams: number
  /**
   * Nur gesetzt, wenn die Zeile aus einem gespeicherten Müsli stammt („Bearbeiten“): Dann gelten die
   * Werte von damals weiter. Ohne Snapshot gelten die aktuellen Werte der Zutat.
   */
  snapshot?: IngredientSnapshot
}

export interface MixDraft {
  /** Gesetzt beim Bearbeiten: Speichern überschreibt dann dieses Müsli statt ein neues anzulegen. */
  mixId?: string
  name: string
  forWhom?: string
  note?: string
  items: DraftItem[]
}

export function emptyDraft(): MixDraft {
  return { name: '', items: [] }
}

/** Fügt eine Zutat mit der Startmenge hinten an. Ist sie schon im Mix, bleibt alles, wie es ist. */
export function addItem(draft: MixDraft, ingredientId: string): MixDraft {
  if (draft.items.some((i) => i.ingredientId === ingredientId)) return draft
  return { ...draft, items: [...draft.items, { ingredientId, grams: DEFAULT_GRAMS }] }
}

/** Setzt die Menge (auf 0,1 g). Bei 0 g fliegt die Zutat aus dem Mix. */
export function setGrams(draft: MixDraft, ingredientId: string, grams: number): MixDraft {
  const g = normalizeGrams(grams)
  const items =
    g > 0
      ? draft.items.map((i) => (i.ingredientId === ingredientId ? { ...i, grams: g } : i))
      : draft.items.filter((i) => i.ingredientId !== ingredientId)
  return { ...draft, items }
}

/** ± im Stepper (10 g). */
export function stepItem(draft: MixDraft, ingredientId: string, direction: 1 | -1): MixDraft {
  const item = draft.items.find((i) => i.ingredientId === ingredientId)
  return item ? setGrams(draft, ingredientId, stepGrams(item.grams, direction)) : draft
}

/** Zeile für die Berechnung, mit der ingredientId fürs Foto und zum Speichern. */
export type DraftLine = MixLine & { ingredientId: string }

/**
 * Zeilen mit den gültigen Werten: eigener Snapshot oder die aktuelle Zutat.
 * Zeilen ohne beides (Zutat gelöscht, etwa durch „Backup ersetzen“) fallen weg.
 */
export function resolveLines(draft: MixDraft, ingredients: ReadonlyMap<string, Ingredient>): DraftLine[] {
  const lines: DraftLine[] = []
  for (const item of draft.items) {
    if (item.grams <= 0) continue
    const current = ingredients.get(item.ingredientId)
    const snapshot = item.snapshot ?? (current && snapshotOf(current))
    if (snapshot) lines.push({ ingredientId: item.ingredientId, grams: item.grams, snapshot })
  }
  return lines
}

/** „Bearbeiten“: das Müsli mit seinen Snapshots, Speichern überschreibt es. */
export function draftFromMix(mix: Mix): MixDraft {
  return {
    mixId: mix.id,
    name: mix.name,
    ...(mix.forWhom !== undefined && { forWhom: mix.forWhom }),
    ...(mix.note !== undefined && { note: mix.note }),
    items: mix.items.map((i) => ({ ingredientId: i.ingredientId, grams: i.grams, snapshot: i.snapshot })),
  }
}

/**
 * „Duplizieren als Vorlage“: neuer, ungespeicherter Mix mit den aktuellen Werten der Zutaten.
 * Nur wenn eine Zutat nicht mehr existiert, bleibt ihr alter Snapshot, damit sie nicht verloren geht.
 */
export function templateFromMix(mix: Mix, existingIngredientIds: ReadonlySet<string>): MixDraft {
  const { mixId: _, ...rest } = draftFromMix(mix)
  return {
    ...rest,
    items: rest.items.map(({ snapshot, ...i }) =>
      existingIngredientIds.has(i.ingredientId) ? i : { ...i, snapshot },
    ),
  }
}

/** Texte aufräumen: getrimmt, leere optionale Felder weggelassen. */
export function normalizeDraftText(draft: MixDraft): MixDraft {
  const forWhom = draft.forWhom?.trim()
  const note = draft.note?.trim()
  const { forWhom: _f, note: _n, ...rest } = draft
  return {
    ...rest,
    name: draft.name.trim().replace(/\s+/g, ' '),
    ...(forWhom && { forWhom }),
    ...(note && { note }),
  }
}

// Prüfung beim Laden: Der Entwurf liegt in IndexedDB und könnte aus einer älteren App-Version stammen.
const allergenId = z.enum(ALLERGENS.map((a) => a.id))
const nonNegative = z.number().min(0)
const draftSchema = z.object({
  mixId: z.string().optional(),
  name: z.string(),
  forWhom: z.string().optional(),
  note: z.string().optional(),
  items: z.array(
    z.object({
      ingredientId: z.string(),
      grams: z.number().positive(),
      snapshot: z
        .object({
          name: z.string(),
          brand: z.string().optional(),
          nutrition: z.object({
            kj: nonNegative, kcal: nonNegative, fat: nonNegative, saturatedFat: nonNegative, carbs: nonNegative,
            sugar: nonNegative, fiber: nonNegative, protein: nonNegative, salt: nonNegative,
          }),
          allergensContains: z.array(allergenId),
          allergensTraces: z.array(allergenId),
        })
        .optional(),
    }),
  ),
})

/** Liest einen gespeicherten Entwurf. Unlesbares ergibt einen leeren Entwurf statt eines Absturzes. */
export function parseDraft(value: unknown): MixDraft {
  const r = draftSchema.safeParse(value)
  return r.success ? r.data : emptyDraft()
}

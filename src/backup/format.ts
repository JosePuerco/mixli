// Aufbau der Backup-Datei (siehe PLAN.md „Backup-Datei“) und ihre Prüfung mit Zod.
// Das Schema beschreibt immer die AKTUELLE formatVersion. Ältere Dateien werden vorher von
// migrate.ts hochgestuft. Wer hier etwas ändert: FORMAT_VERSION erhöhen und eine Migration anlegen.
import { z } from 'zod'
import { ALLERGENS, type AllergenId } from '../domain/allergens'
import { base64ToBytes } from './base64'

export const BACKUP_APP = 'mixli'
export const FORMAT_VERSION = 1

/** Einstellungen, die nur zu diesem Gerät gehören und weder exportiert noch importiert werden. */
export const LAST_BACKUP_KEY = 'lastBackupAt'
/** Der Mix in Arbeit (Mixen-Screen). Halbfertiges gehört nicht ins Backup. */
export const MIX_DRAFT_KEY = 'mixDraft'
export const DEVICE_SETTING_KEYS: readonly string[] = [LAST_BACKUP_KEY, MIX_DRAFT_KEY]
/** Der Filter beim Mixen (Allergene, Tags). Kommt mit ins Backup. */
export const DEFAULT_FILTER_KEY = 'defaultFilter'
/** Der eigene Filter bei „Meine Müslis“. Kommt mit ins Backup. */
export const MUESLI_FILTER_KEY = 'muesliFilter'
/** Unter diesen Schlüsseln liegen Filter. */
export type FilterKey = typeof DEFAULT_FILTER_KEY | typeof MUESLI_FILTER_KEY

const allergenIds = ALLERGENS.map((a) => a.id) as [AllergenId, ...AllergenId[]]

const id = z.string().min(1)
const text = z.string()
/** ISO-Text in der Datei, Date in der App. */
const date = z.iso.datetime({ offset: true }).transform((s) => new Date(s))
const amount = z.number().nonnegative()
const allergenList = z.array(z.enum(allergenIds))

const nutrition = z.object({
  kj: amount,
  kcal: amount,
  fat: amount,
  saturatedFat: amount,
  carbs: amount,
  sugar: amount,
  fiber: amount,
  protein: amount,
  salt: amount,
})

const category = z.object({ id, name: text.min(1), order: z.number() })

const ingredient = z.object({
  id,
  name: text.min(1),
  brand: text.optional(),
  categoryId: id.optional(),
  photoId: id.optional(),
  nutrition,
  allergensContains: allergenList,
  allergensTraces: allergenList,
  tags: z.array(text),
  note: text.optional(),
  archived: z.boolean(),
  createdAt: date,
  updatedAt: date,
})

const mix = z.object({
  id,
  name: text.min(1),
  forWhom: text.optional(),
  items: z.array(
    z.object({
      ingredientId: id,
      grams: z.number().positive(),
      snapshot: z.object({
        name: text.min(1),
        brand: text.optional(),
        nutrition,
        allergensContains: allergenList,
        allergensTraces: allergenList,
      }),
    }),
  ),
  note: text.optional(),
  createdAt: date,
  updatedAt: date,
})

const photo = z.object({
  id,
  type: z.string().regex(/^image\/[\w.+-]+$/),
  createdAt: date,
  data: z.base64().transform(base64ToBytes),
})

const setting = z.object({ key: id, value: z.unknown() })

/** Meldet doppelte ids innerhalb einer Tabelle (sonst würde beim Import still eine die andere überschreiben). */
function uniqueIds<T extends { id: string }>(label: string) {
  return (rows: T[], ctx: z.RefinementCtx) => {
    const seen = new Set<string>()
    for (const row of rows) {
      if (seen.has(row.id)) ctx.addIssue({ code: 'custom', message: `${label}: doppelte id ${row.id}` })
      seen.add(row.id)
    }
  }
}

export const backupSchema = z.object({
  app: z.literal(BACKUP_APP),
  formatVersion: z.literal(FORMAT_VERSION),
  exportedAt: date,
  appVersion: z.string().optional(),
  data: z.object({
    categories: z.array(category).superRefine(uniqueIds('Kategorien')),
    ingredients: z.array(ingredient).superRefine(uniqueIds('Zutaten')),
    mixes: z.array(mix).superRefine(uniqueIds('Müslis')),
    photos: z.array(photo).superRefine(uniqueIds('Fotos')),
    settings: z.array(setting),
  }),
})

/** So steht es in der Datei (Datum als Text, Fotos als Base64). */
export type BackupFile = z.input<typeof backupSchema>
/** So kommt es nach der Prüfung heraus (Date, Fotos als Bytes). */
export type BackupData = z.output<typeof backupSchema>

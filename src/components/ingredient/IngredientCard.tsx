// Zutatenkarte im Raster: weiße Karte, 8 px Innenabstand, Foto oben (Radius 18, 104 px),
// darunter Name (15/700), „Marke · kcal“ (12, gedämpft) und ein Allergen-Chip.
import { motion, useReducedMotion } from 'motion/react'
import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { PhotoView } from '../ui/PhotoView'
import { db } from '../../db/db'
import { photoToBlob } from '../../db/photo'
import type { Ingredient } from '../../db/types'
import { cardAllergen } from '../../domain/ingredient'
import { cardIn, press } from '../../design/motion'
import { photoPlaceholderColors } from '../../design/tokens'
import { formatWithUnit } from '../../lib/format'

/** Gleichbleibende Platzhalterfarbe je Zutat (aus den Token-Farben). */
function placeholderColor(id: string): string {
  let h = 0
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return photoPlaceholderColors[h % photoPlaceholderColors.length]
}

/** Foto aus der eigenen Tabelle laden – so bleiben Listen schnell, auch mit vielen Fotos. */
export function IngredientPhoto({ id, photoId, className = '' }: { id: string; photoId?: string; className?: string }) {
  const photo = useLiveQuery(() => (photoId ? db.photos.get(photoId) : undefined), [photoId])
  // Neuer Blob nur, wenn sich das Foto ändert – sonst entstünde bei jedem Zeichnen eine neue Bild-URL.
  const blob = useMemo(() => photoToBlob(photo), [photo])
  return (
    <div className={`overflow-hidden ${className}`} style={{ backgroundColor: placeholderColor(id) }}>
      <PhotoView blob={blob} />
    </div>
  )
}

interface IngredientCardProps {
  ingredient: Ingredient
  onOpen: () => void
  /** Position für das gestaffelte Erscheinen; ohne Angabe erscheint die Karte sofort. */
  appearIndex?: number
}

export function IngredientCard({ ingredient: i, onOpen, appearIndex }: IngredientCardProps) {
  const reduceMotion = useReducedMotion()
  const allergen = cardAllergen(i)
  const kcal = formatWithUnit(i.nutrition.kcal, 'kcal')
  const meta = i.brand ? `${i.brand} · ${kcal}` : kcal

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      {...(appearIndex === undefined || reduceMotion ? {} : cardIn(appearIndex))}
      whileTap={press.whileTap}
      className="flex min-w-0 flex-col gap-gap-sm rounded-card bg-surface p-gap-sm pb-gap-md text-left"
    >
      <IngredientPhoto id={i.id} photoId={i.photoId} className="h-26 w-full rounded-photo" />
      <span className="flex min-w-0 flex-col gap-0.5 px-1.5">
        <span className="truncate text-body font-bold">{i.name}</span>
        <span className="truncate text-caption text-text-muted">{meta}</span>
      </span>
      {allergen && (
        <span className="flex items-center gap-1 px-1.5">
          <span
            className={`inline-flex h-6 min-w-0 items-center truncate rounded-pill px-2.5 text-caption font-bold ${
              allergen.kind === 'contains'
                ? 'bg-surface-muted'
                : 'border border-dashed border-border-dashed text-text-muted'
            }`}
          >
            {allergen.kind === 'traces' ? `Spuren: ${allergen.label}` : allergen.label}
          </span>
          {allergen.more > 0 && (
            <span className="shrink-0 text-caption font-bold text-text-muted" aria-label={`und ${allergen.more} weitere`}>
              +{allergen.more}
            </span>
          )}
        </span>
      )}
    </motion.button>
  )
}

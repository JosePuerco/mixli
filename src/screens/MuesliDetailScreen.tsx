// Müsli-Detail: Zurück, „Bearbeiten“; für wen · Datum, Name groß; Karte Zusammensetzung (Balken, Zeilen mit
// Farbpunkt, Name, %, Gramm); volle Nährwerttabelle pro 100 g; Allergene; Notiz; Löschen.
// Unten „Duplizieren“ und „Etikett“ (öffnet den Etikett-Sheet). Alle Werte stammen aus den Snapshots.
import { useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { IconBack, IconLabel } from '../components/icons/Icons'
import { LabelSheet } from '../components/label/LabelSheet'
import { MixBar } from '../components/mix/MixBar'
import { segmentColor } from '../components/mix/MixRing'
import { FilterWarningCard } from '../components/mix/FilterWarning'
import { NutritionTable } from '../components/mix/NutritionTable'
import { useMuesliCheck } from '../components/mix/useMixFilter'
import { useOpenInMixer } from '../components/mix/useOpenInMixer'
import { Button } from '../components/ui/Button'
import { Card, CardTitle } from '../components/ui/Card'
import { AllergenChip } from '../components/ui/Chip'
import { ConfirmSheet } from '../components/ui/ConfirmSheet'
import { FlowLayout } from '../components/ui/FlowLayout'
import { IconButton } from '../components/ui/IconButton'
import { db } from '../db/db'
import { deleteMix } from '../db/repo'
import type { Mix } from '../db/types'
import { allergenLabel } from '../domain/allergens'
import { mixAllergens, nutritionPer100g, shares, totalGrams } from '../domain/mix'
import { mixMeta } from '../domain/mixList'
import { formatGrams, formatShare } from '../domain/rounding'

export function MuesliDetailScreen() {
  const { id = '' } = useParams()
  // undefined = lädt noch, null = gibt es nicht.
  const mix = useLiveQuery(async () => (await db.mixes.get(id)) ?? null, [id])

  if (mix === undefined) return null
  if (mix === null) return <NotFound />
  return <Detail mix={mix} />
}

function DetailHeader({ action }: { action?: ReactNode }) {
  const navigate = useNavigate()
  return (
    <div className="flex items-center justify-between">
      {/* Immer zur Liste: Man kommt auch direkt nach dem Speichern aus „Mixen“ hierher. */}
      <IconButton aria-label="Zurück zur Liste" onClick={() => navigate('/muesli')}>
        <IconBack size={20} strokeWidth={1.8} />
      </IconButton>
      {action}
    </div>
  )
}

function NotFound() {
  const navigate = useNavigate()
  return (
    <FlowLayout
      header={<DetailHeader />}
      footer={
        <Button fullWidth onClick={() => navigate('/muesli', { replace: true })}>
          Zur Müsli-Liste
        </Button>
      }
    >
      <p className="px-1 pt-8 text-center text-sm font-medium text-text-muted">Dieses Müsli gibt es nicht mehr.</p>
    </FlowLayout>
  )
}

function Detail({ mix }: { mix: Mix }) {
  const navigate = useNavigate()
  const { open, confirmSheet } = useOpenInMixer()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [labelOpen, setLabelOpen] = useState(false)
  // Hinweis gegen den Filter bei „Meine Müslis“ (nicht den beim Mixen).
  const muesliCheck = useMuesliCheck()
  const violations = muesliCheck?.check(mix) ?? []

  const total = totalGrams(mix.items)
  const itemShares = shares(mix.items)
  const nutrition = nutritionPer100g(mix.items)
  const allergens = mixAllergens(mix.items)

  async function remove() {
    setConfirmDelete(false)
    await deleteMix(mix.id)
    navigate('/muesli', { replace: true })
  }

  return (
    <>
      <FlowLayout
        header={
          <DetailHeader
            action={
              <Button variant="surface" size="xs" onClick={() => open('edit', mix.id)}>
                Bearbeiten
              </Button>
            }
          />
        }
        footer={
          <div className="grid grid-cols-[1fr_2fr] gap-2.5">
            {/* Schmale Spalte: ohne Icon und mit wenig Innenabstand, wie im Prototyp. */}
            <Button variant="surface" className="px-2" onClick={() => open('duplicate', mix.id)}>
              Duplizieren
            </Button>
            <Button disabled={!nutrition} onClick={() => setLabelOpen(true)}>
              <IconLabel size={18} />
              Etikett
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-0.5 px-1">
            <span className="text-label font-normal text-text-muted">{mixMeta(mix)}</span>
            <h1 className="text-h1-detail tracking-tight">{mix.name}</h1>
          </div>

          {muesliCheck && violations.length > 0 && <FilterWarningCard filter={muesliCheck.filter} violations={violations} />}

          <Card className="flex flex-col gap-gap-md">
            <div className="flex items-baseline justify-between gap-gap-md">
              <h2 className="text-body font-bold">Zusammensetzung</h2>
              <span className="text-h2 font-extrabold">{formatGrams(total)}</span>
            </div>
            <MixBar shares={itemShares} size="lg" />
            <ul className="flex flex-col">
              {mix.items.map((item, i) => (
                <li
                  key={item.ingredientId}
                  className={`flex h-10 items-center gap-2.5 ${i < mix.items.length - 1 ? 'border-b border-divider' : ''}`}
                >
                  <span className="size-2.5 shrink-0 rounded-pill" style={{ backgroundColor: segmentColor(i) }} aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-body">{item.snapshot.name}</span>
                  <span className="text-sm font-medium text-text-muted">{formatShare(itemShares[i])}</span>
                  <span className="w-16 text-right text-body font-bold">{formatGrams(item.grams)}</span>
                </li>
              ))}
            </ul>
          </Card>

          {nutrition && (
            <Card className="flex flex-col gap-gap-sm">
              <CardTitle aside="pro 100 g">Nährwerte</CardTitle>
              <NutritionTable nutrition={nutrition} />
            </Card>
          )}

          <div className="flex flex-wrap gap-gap-sm px-1" aria-label="Allergene">
            {allergens.contains.map((a) => (
              <AllergenChip key={a} label={allergenLabel(a)} kind="contains" />
            ))}
            {allergens.traces.map((a) => (
              <AllergenChip key={a} label={allergenLabel(a)} kind="traces" />
            ))}
            {allergens.contains.length + allergens.traces.length === 0 && (
              <span className="text-caption text-text-muted">Keine Allergene</span>
            )}
          </div>

          {mix.note && (
            <Card className="flex flex-col gap-1">
              <h2 className="text-body font-bold">Notiz</h2>
              <p className="text-sm font-medium whitespace-pre-line text-text-muted">{mix.note}</p>
            </Card>
          )}

          <Button variant="surface" size="md" fullWidth onClick={() => setConfirmDelete(true)}>
            Müsli löschen
          </Button>
        </div>
      </FlowLayout>

      {confirmSheet}
      <LabelSheet open={labelOpen} onClose={() => setLabelOpen(false)} mix={mix} />
      <ConfirmSheet
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Müsli löschen?"
        text={`„${mix.name}“ wird gelöscht. Die Zutaten bleiben erhalten.`}
        confirmLabel="Löschen"
        onConfirm={remove}
      />
    </>
  )
}

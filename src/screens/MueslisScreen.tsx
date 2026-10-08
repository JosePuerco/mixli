// Meine Müslis: Anzahl, Titel, Umschalter „Neueste | A–Z“, eine Karte je Müsli (Name, für wen · Datum,
// Gesamtmenge, Anteilsbalken, Zutaten; Fußzeile mit Allergenen und „Duplizieren“). Antippen öffnet das Detail.
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'motion/react'
import { IconCopy } from '../components/icons/Icons'
import { MixBar } from '../components/mix/MixBar'
import { useOpenInMixer } from '../components/mix/useOpenInMixer'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { SegmentedControl } from '../components/ui/Chip'
import { Screen } from '../components/ui/Screen'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { db } from '../db/db'
import type { Mix } from '../db/types'
import { press } from '../design/motion'
import { mixAllergens, shares, totalGrams } from '../domain/mix'
import { allergenSummary, ingredientNames, mixCountLabel, mixMeta, sortMixes, type MixSort } from '../domain/mixList'
import { formatGrams } from '../domain/rounding'

const SORT_OPTIONS: { value: MixSort; label: string }[] = [
  { value: 'newest', label: 'Neueste' },
  { value: 'az', label: 'A–Z' },
]

export function MueslisScreen() {
  const navigate = useNavigate()
  const mixes = useLiveQuery(() => db.mixes.toArray(), [])
  const [sort, setSort] = useState<MixSort>('newest')
  const { open, confirmSheet } = useOpenInMixer()

  // Noch nicht geladen: nichts zeigen, damit der leere Zustand nicht kurz aufblitzt.
  if (mixes === undefined) return null

  return (
    <>
      <Screen>
        <ScreenHeader
          eyebrow={mixCountLabel(mixes.length)}
          title="Meine Müslis"
          action={
            mixes.length > 1 && (
              <SegmentedControl aria-label="Sortierung" options={SORT_OPTIONS} value={sort} onChange={setSort} />
            )
          }
        />

        {mixes.length === 0 ? (
          <Card className="flex flex-col items-start gap-gap-md">
            <p className="text-sm font-medium text-text-muted">
              Noch keine Müslis gespeichert. Stell unter „Mixen“ eins zusammen und speichere es.
            </p>
            <Button size="sm" onClick={() => navigate('/mixen')}>
              Zum Mixen
            </Button>
          </Card>
        ) : (
          sortMixes(mixes, sort).map((m) => (
            <MuesliCard
              key={m.id}
              mix={m}
              onOpen={() => navigate(`/muesli/${m.id}`)}
              onDuplicate={() => open('duplicate', m.id)}
            />
          ))
        )}
      </Screen>
      {confirmSheet}
    </>
  )
}

function MuesliCard({ mix, onOpen, onDuplicate }: { mix: Mix; onOpen: () => void; onDuplicate: () => void }) {
  return (
    <Card className="flex flex-col gap-gap-md">
      <motion.button type="button" whileTap={{ scale: 0.98 }} onClick={onOpen} className="flex flex-col gap-gap-md text-left">
        <span className="flex items-start justify-between gap-gap-md">
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="text-lg font-bold">{mix.name}</span>
            <span className="text-label font-normal text-text-muted">{mixMeta(mix)}</span>
          </span>
          <span className="shrink-0 text-lg font-extrabold whitespace-nowrap">{formatGrams(totalGrams(mix.items))}</span>
        </span>
        <MixBar shares={shares(mix.items)} />
        <span className="text-label font-normal text-text-muted">{ingredientNames(mix.items)}</span>
      </motion.button>
      <div className="flex items-center justify-between gap-gap-md border-t border-divider pt-2.5">
        <span className="min-w-0 text-caption font-bold">{allergenSummary(mixAllergens(mix.items))}</span>
        <motion.button
          type="button"
          {...press}
          onClick={onDuplicate}
          aria-label={`${mix.name} duplizieren`}
          className="touch-extend inline-flex h-9 shrink-0 items-center gap-1.5 rounded-pill bg-surface-muted px-3 text-label"
        >
          <IconCopy size={16} strokeWidth={1.8} />
          Duplizieren
        </motion.button>
      </div>
    </Card>
  )
}

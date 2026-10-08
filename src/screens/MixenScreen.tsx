// Mixen: Übersichtskarte (Ring, kcal, Eiweiß, Kohlenhydrate, Fett), Zutatenkarten mit Stepper,
// Kachel „Zutat hinzufügen“, Allergen-Chips. Alles wird live aus dem Entwurf berechnet und erst bei der
// Anzeige gerundet. Der Entwurf übersteht Tab-Wechsel und Neustart (useMixDraft).
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'motion/react'
import { IconPlus } from '../components/icons/Icons'
import { AddIngredientSheet } from '../components/mix/AddIngredientSheet'
import { AmountSheet } from '../components/mix/AmountSheet'
import { MixItemCard } from '../components/mix/MixItemCard'
import { segmentColor } from '../components/mix/MixRing'
import { MixSummaryCard } from '../components/mix/MixSummaryCard'
import { useMixDraft } from '../components/mix/useMixDraft'
import { AllergenChip } from '../components/ui/Chip'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Screen } from '../components/ui/Screen'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { db } from '../db/db'
import { press } from '../design/motion'
import { allergenLabel } from '../domain/allergens'
import { byName } from '../domain/ingredient'
import { mixAllergens, nutritionPer100g, shares, totalGrams } from '../domain/mix'
import { addItem, resolveLines, setGrams, stepItem } from '../domain/mixDraft'

export function MixenScreen() {
  const navigate = useNavigate()
  const { draft, update } = useMixDraft()
  const ingredients = useLiveQuery(() => db.ingredients.toArray(), [])
  const [adding, setAdding] = useState(false)
  // Mengen-Sheet: Zutat beim Öffnen merken und getrennt vom Offen-Zustand halten, damit der Inhalt
  // beim Hinausgleiten stehen bleibt (auch wenn die Zutat bei 0 g gerade aus dem Mix geflogen ist).
  const [amountItem, setAmountItem] = useState({ id: '', name: '', grams: 0 })
  const [amountOpen, setAmountOpen] = useState(false)
  // In dieser Sitzung hinzugefügte Zutaten ploppen herein; beim Öffnen des Screens nichts animieren.
  const added = useRef(new Set<string>())

  // Noch nicht geladen: nichts zeigen, damit nichts kurz aufblitzt.
  if (!draft || !ingredients) return null

  const byId = new Map(ingredients.map((i) => [i.id, i]))
  const lines = resolveLines(draft, byId)
  const total = totalGrams(lines)
  const lineShares = shares(lines)
  const nutrition = nutritionPer100g(lines)
  const allergens = mixAllergens(lines)
  const active = ingredients.filter((i) => !i.archived)
  const inMix = new Set(draft.items.map((i) => i.ingredientId))
  const available = active.filter((i) => !inMix.has(i.id)).sort(byName)

  function add(id: string) {
    added.current.add(id)
    update((d) => addItem(d, id))
    setAdding(false)
  }

  function openAmount(id: string, name: string, grams: number) {
    setAmountItem({ id, name, grams })
    setAmountOpen(true)
  }

  return (
    <>
      <Screen>
        <ScreenHeader
          eyebrow={draft.mixId ? 'Müsli bearbeiten' : 'Neue Mischung'}
          title={draft.name || 'Mixen'}
        />

        {nutrition ? (
          <MixSummaryCard
            shares={lineShares}
            keys={lines.map((l) => l.ingredientId)}
            total={total}
            nutrition={nutrition}
          />
        ) : active.length === 0 ? (
          <Card className="flex flex-col items-start gap-gap-md">
            <p className="text-sm font-medium text-text-muted">
              Lege zuerst ein paar Zutaten an. Dann stellst du hier dein Müsli zusammen.
            </p>
            <Button size="sm" onClick={() => navigate('/zutaten/neu')}>
              Zutat anlegen
            </Button>
          </Card>
        ) : (
          <Card>
            <p className="text-sm font-medium text-text-muted">
              Füge Zutaten hinzu. Nährwerte pro 100 g und Allergene rechnen sich sofort mit.
            </p>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-gap-md">
          {lines.map((l, i) => (
            <MixItemCard
              key={l.ingredientId}
              ingredientId={l.ingredientId}
              photoId={byId.get(l.ingredientId)?.photoId}
              name={l.snapshot.name}
              grams={l.grams}
              share={lineShares[i]}
              color={segmentColor(i)}
              appear={added.current.has(l.ingredientId)}
              onStep={(dir) => update((d) => stepItem(d, l.ingredientId, dir))}
              onEditAmount={() => openAmount(l.ingredientId, l.snapshot.name, l.grams)}
            />
          ))}
          {active.length > 0 && (
            <motion.button
              type="button"
              {...press}
              onClick={() => setAdding(true)}
              className="flex min-h-49 flex-col items-center justify-center gap-gap-sm rounded-card border-[1.5px] border-dashed border-nav-icon text-sm font-semibold text-text-muted"
            >
              <span className="inline-flex size-touch items-center justify-center rounded-pill bg-surface text-accent" aria-hidden="true">
                <IconPlus size={22} />
              </span>
              Zutat hinzufügen
            </motion.button>
          )}
        </div>

        {lines.length > 0 && (
          <div className="flex flex-wrap gap-gap-sm px-1" aria-label="Allergene">
            {allergens.contains.map((id) => (
              <AllergenChip key={id} label={allergenLabel(id)} kind="contains" />
            ))}
            {allergens.traces.map((id) => (
              <AllergenChip key={id} label={allergenLabel(id)} kind="traces" />
            ))}
            {allergens.contains.length + allergens.traces.length === 0 && (
              <span className="text-caption text-text-muted">Keine Allergene</span>
            )}
          </div>
        )}
      </Screen>

      <AddIngredientSheet
        open={adding}
        onClose={() => setAdding(false)}
        available={available}
        hasIngredients={active.length > 0}
        onAdd={add}
        onCreateIngredient={() => navigate('/zutaten/neu')}
      />

      <AmountSheet
        open={amountOpen}
        name={amountItem.name}
        grams={amountItem.grams}
        onClose={() => setAmountOpen(false)}
        onApply={(g) => {
          update((d) => setGrams(d, amountItem.id, g))
          setAmountOpen(false)
        }}
      />
    </>
  )
}

// Übersicht der UI-Bausteine zum Prüfen auf dem Handy (#/komponenten).
// Nicht in der Navigation verlinkt; wird entfernt, sobald die echten Screens stehen.
import { Screen } from '../components/ui/Screen'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { Card, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Fab, IconButton } from '../components/ui/IconButton'
import { useState } from 'react'
import { IconBack, IconClose, IconCopy, IconLabel, IconPlus, IconTrash } from '../components/icons/Icons'
import { AddChip, AllergenChip, ChipScroller, ChoiceChip, SegmentedControl } from '../components/ui/Chip'
import { BottomSheet } from '../components/ui/BottomSheet'
import { ALLERGENS } from '../domain/allergens'

const CATEGORIES = ['Alle', 'Flocken', 'Nüsse', 'Samen', 'Trockenfrüchte', 'Extras']
const TAGS = ['vegan', 'ohne Zuckerzusatz', 'Bio']
// Vollständige Klassennamen, damit Tailwind sie beim Build findet.
const PHOTO_TINTS = ['bg-photo-1', 'bg-photo-2', 'bg-photo-3', 'bg-photo-4', 'bg-photo-5', 'bg-photo-6', 'bg-photo-7']
const SHEET_ROWS = [
  { name: 'Leinsamen', info: 'Spuren: Sesam', kcal: 500, nuts: false },
  { name: 'Cashewkerne', info: 'Schalenfrüchte', kcal: 580, nuts: true },
  { name: 'Kokoschips', info: 'Spuren: Schalenfrüchte', kcal: 660, nuts: true },
  { name: 'Kakaonibs', info: 'Spuren: Milch', kcal: 600, nuts: false },
  { name: 'Dinkelflocken', info: 'Gluten', kcal: 360, nuts: false },
  { name: 'Rosinen', info: 'Sulfite', kcal: 299, nuts: false },
  { name: 'Kürbiskerne', info: 'keine Allergene', kcal: 590, nuts: false },
  { name: 'Haselnüsse', info: 'Schalenfrüchte', kcal: 650, nuts: true },
]

export function KomponentenScreen() {
  const [category, setCategory] = useState('Alle')
  const [tags, setTags] = useState<string[]>(['vegan'])
  const [sort, setSort] = useState<'new' | 'az'>('new')
  const [allergenCount, setAllergenCount] = useState(2)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [noNuts, setNoNuts] = useState(false)

  const toggleTag = (t: string) => setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]))

  return (
    <>
      <Screen>
        <ScreenHeader
          eyebrow="Design-System"
          title="Komponenten"
          action={
            <SegmentedControl
              aria-label="Sortierung"
              value={sort}
              onChange={setSort}
              options={[
                { value: 'new', label: 'Neueste' },
                { value: 'az', label: 'A–Z' },
              ]}
            />
          }
        />

        <ChipScroller aria-label="Kategorien">
          {CATEGORIES.map((c) => (
            <ChoiceChip key={c} selected={category === c} onClick={() => setCategory(c)}>
              {c}
            </ChoiceChip>
          ))}
        </ChipScroller>

        <section className="flex flex-col gap-2.5">
          <h2 className="px-1 text-label">Tags</h2>
          <div className="flex flex-wrap gap-gap-sm">
            {TAGS.map((t) => (
              <ChoiceChip key={t} size="lg" tone="accent" selected={tags.includes(t)} onClick={() => toggleTag(t)}>
                {t}
              </ChoiceChip>
            ))}
            <AddChip>Tag</AddChip>
          </div>
        </section>

        <section className="flex flex-col gap-2.5">
          <h2 className="px-1 text-label">Allergene</h2>
          <div className="flex flex-wrap gap-gap-sm">
            {ALLERGENS.slice(0, allergenCount).map((a, i) => (
              <AllergenChip key={a.id} label={a.label} kind={i % 3 === 2 ? 'traces' : 'contains'} appear={i >= 2} />
            ))}
          </div>
          <div className="flex gap-gap-sm">
            <Button variant="surface" size="xs" onClick={() => setAllergenCount((n) => Math.min(n + 1, ALLERGENS.length))}>
              Allergen hinzufügen
            </Button>
            <Button variant="surface" size="xs" onClick={() => setAllergenCount(2)}>
              Zurücksetzen
            </Button>
          </div>
        </section>

        <Button fullWidth onClick={() => setSheetOpen(true)}>
          Sheet öffnen
        </Button>

        <Card appearIndex={0} className="flex flex-col gap-gap-md">
          <CardTitle aside="56 · 52 · 48 · 44 px">Primär</CardTitle>
          <Button fullWidth>Weiter</Button>
          <Button fullWidth size="md">
            <IconLabel size={18} />
            Etikett
          </Button>
          <div className="grid grid-cols-2 gap-gap-sm">
            <Button size="sm">Exportieren</Button>
            <Button size="sm" disabled>
              Deaktiviert
            </Button>
          </div>
        </Card>

        <Card appearIndex={1} className="flex flex-col gap-gap-md">
          <CardTitle>Sekundär</CardTitle>
          <div className="grid grid-cols-2 gap-gap-sm">
            <Button variant="muted" size="sm">
              Importieren
            </Button>
            <Button variant="dark" size="sm">
              Hinzufügen
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-gap-sm">
            <Button variant="muted" size="xs">
              Fertig
            </Button>
            <Button variant="muted" size="compact">
              <IconCopy size={16} />
              Duplizieren
            </Button>
          </div>
        </Card>

        {/* Weiße Sekundär-Buttons stehen direkt auf dem grauen Grund. */}
        <div className="grid grid-cols-2 gap-gap-md">
          <Button variant="surface" size="md">
            Kamera
          </Button>
          <Button variant="surface" size="md">
            Galerie
          </Button>
        </div>

        <div className="flex items-center gap-gap-md">
          <IconButton aria-label="Schließen">
            <IconClose size={20} />
          </IconButton>
          <IconButton aria-label="Zurück">
            <IconBack size={20} />
          </IconButton>
          <Button variant="surface" size="xs">
            Bearbeiten
          </Button>
          <IconButton aria-label="Löschen" variant="ghost">
            <IconTrash size={18} />
          </IconButton>
        </div>

        <Card appearIndex={2} padding="list">
          {['Flocken', 'Nüsse', 'Samen', 'Trockenfrüchte', 'Extras'].map((name) => (
            <div key={name} className="flex h-12 items-center justify-between border-b border-divider last:border-b-0">
              <span className="text-body">{name}</span>
              <IconButton aria-label={`${name} löschen`} variant="ghost">
                <IconTrash size={18} />
              </IconButton>
            </div>
          ))}
        </Card>

        <div className="grid grid-cols-2 gap-gap-md">
          {['Haferflocken', 'Mandeln', 'Rosinen', 'Leinsamen'].map((name, i) => (
            <Card key={name} appearIndex={3 + i} padding="tight" className="flex flex-col gap-gap-sm">
              <div className={`h-24 rounded-photo ${['bg-photo-1', 'bg-photo-2', 'bg-photo-3', 'bg-photo-4'][i]}`} />
              <div className="px-1">
                <p className="text-body font-bold">{name}</p>
                <p className="text-caption text-text-muted">Beispiel · 372 kcal</p>
              </div>
            </Card>
          ))}
        </div>
      </Screen>
      <Fab aria-label="Neue Zutat" />

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Zutat hinzufügen"
        headerAction={
          <Button variant="muted" size="xs" onClick={() => setSheetOpen(false)}>
            Fertig
          </Button>
        }
      >
        <div className="flex gap-gap-sm px-1">
          <ChoiceChip outlined selected={noNuts} onClick={() => setNoNuts((v) => !v)}>
            Ohne Schalenfrüchte
          </ChoiceChip>
        </div>
        <div className="flex flex-col gap-gap-sm">
          {SHEET_ROWS.map((row, i) => {
            const blocked = noNuts && row.nuts
            return (
              <button
                key={row.name}
                type="button"
                disabled={blocked}
                className="flex items-center gap-gap-md rounded-photo bg-surface-muted p-2 text-left transition-opacity duration-300 disabled:opacity-35"
              >
                <span className={`size-13 shrink-0 rounded-photo ${PHOTO_TINTS[i % PHOTO_TINTS.length]}`} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-body font-bold">{row.name}</span>
                  <span className="text-caption text-text-muted">{blocked ? 'Ausgeschlossen durch Filter' : row.info}</span>
                </span>
                <span className="text-caption text-text-muted">{row.kcal} kcal</span>
                <span className="flex size-touch items-center justify-center rounded-pill bg-surface text-accent">
                  <IconPlus size={18} />
                </span>
              </button>
            )
          })}
        </div>
      </BottomSheet>
    </>
  )
}

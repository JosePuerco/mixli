// Übersicht der UI-Bausteine zum Prüfen auf dem Handy (#/komponenten).
// Nicht in der Navigation verlinkt; wird entfernt, sobald die echten Screens stehen.
import { Screen } from '../components/ui/Screen'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { Card, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Fab, IconButton } from '../components/ui/IconButton'
import { IconBack, IconClose, IconCopy, IconLabel, IconTrash } from '../components/icons/Icons'

export function KomponentenScreen() {
  return (
    <>
      <Screen>
        <ScreenHeader eyebrow="Design-System" title="Komponenten" />

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
    </>
  )
}

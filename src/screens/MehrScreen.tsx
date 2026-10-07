// „Mehr“: Backup (ab Phase 2), Kategorien verwalten, Infos zur App.
import { Screen } from '../components/ui/Screen'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { Card, CardTitle } from '../components/ui/Card'
import { CategoryManager } from '../components/settings/CategoryManager'
import { version } from '../../package.json'

export function MehrScreen() {
  return (
    <Screen>
      <ScreenHeader title="Mehr" />

      <Card className="flex flex-col gap-gap-md">
        <CardTitle>Backup</CardTitle>
        <p className="text-caption text-text-muted">
          Deine Daten liegen nur auf diesem Gerät. Export und Import als Datei kommen mit dem nächsten Update.
        </p>
      </Card>

      <CategoryManager />

      <Card padding="list">
        <dl>
          <div className="flex min-h-13 items-center justify-between border-b border-divider">
            <dt className="text-body">Etikettenformat</dt>
            <dd className="text-sm font-medium text-text-muted">70 × 42,3 mm</dd>
          </div>
          <div className="flex min-h-13 items-center justify-between">
            <dt className="text-body">Version</dt>
            <dd className="text-sm font-medium text-text-muted">Mixli {version}</dd>
          </div>
        </dl>
      </Card>
    </Screen>
  )
}

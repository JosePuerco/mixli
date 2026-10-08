// „Mehr“: Backup, Kategorien verwalten, Infos zur App.
import { Screen } from '../components/ui/Screen'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { Card } from '../components/ui/Card'
import { BackupCard } from '../components/settings/BackupCard'
import { CategoryManager } from '../components/settings/CategoryManager'
import { version } from '../../package.json'

export function MehrScreen() {
  return (
    <Screen>
      <ScreenHeader title="Mehr" />

      <BackupCard />

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

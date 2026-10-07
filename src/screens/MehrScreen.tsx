import { Screen } from '../components/ui/Screen'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { PlaceholderCard } from '../components/ui/PlaceholderCard'

export function MehrScreen() {
  return (
    <Screen>
      <ScreenHeader title="Mehr" />
      <PlaceholderCard text="Hier kommen bald Backup, Kategorien und Infos zur App hin." />
    </Screen>
  )
}

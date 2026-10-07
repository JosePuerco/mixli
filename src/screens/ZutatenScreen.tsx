import { Screen } from '../components/ui/Screen'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { PlaceholderCard } from '../components/ui/PlaceholderCard'

export function ZutatenScreen() {
  return (
    <Screen>
      <ScreenHeader title="Zutaten" />
      <PlaceholderCard text="Hier erscheinen bald deine Zutaten mit Foto, Nährwerten und Allergenen." />
    </Screen>
  )
}

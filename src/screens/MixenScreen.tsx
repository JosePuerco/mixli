import { Screen } from '../components/ui/Screen'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { PlaceholderCard } from '../components/ui/PlaceholderCard'

export function MixenScreen() {
  return (
    <Screen>
      <ScreenHeader title="Mixen" />
      <PlaceholderCard text="Hier stellst du bald dein Müsli aus deinen Zutaten zusammen." />
    </Screen>
  )
}

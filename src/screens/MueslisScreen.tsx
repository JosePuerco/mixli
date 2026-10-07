import { Screen } from '../components/ui/Screen'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { PlaceholderCard } from '../components/ui/PlaceholderCard'

export function MueslisScreen() {
  return (
    <Screen>
      <ScreenHeader title="Meine Müslis" />
      <PlaceholderCard text="Hier findest du bald deine gespeicherten Müslis." />
    </Screen>
  )
}

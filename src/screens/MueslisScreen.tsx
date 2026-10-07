import { ScreenHeader } from '../components/ui/ScreenHeader'
import { PlaceholderCard } from '../components/ui/PlaceholderCard'

export function MueslisScreen() {
  return (
    <div className="flex flex-col gap-gap-lg">
      <ScreenHeader title="Meine Müslis" />
      <PlaceholderCard text="Hier findest du bald deine gespeicherten Müslis." />
    </div>
  )
}

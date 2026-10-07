import { ScreenHeader } from '../components/ui/ScreenHeader'
import { PlaceholderCard } from '../components/ui/PlaceholderCard'

export function MixenScreen() {
  return (
    <div className="flex flex-col gap-gap-lg">
      <ScreenHeader title="Mixen" />
      <PlaceholderCard text="Hier stellst du bald dein Müsli aus deinen Zutaten zusammen." />
    </div>
  )
}

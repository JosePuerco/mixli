import { ScreenHeader } from '../components/ui/ScreenHeader'
import { PlaceholderCard } from '../components/ui/PlaceholderCard'

export function ZutatenScreen() {
  return (
    <div className="flex flex-col gap-gap-lg">
      <ScreenHeader title="Zutaten" />
      <PlaceholderCard text="Hier erscheinen bald deine Zutaten mit Foto, Nährwerten und Allergenen." />
    </div>
  )
}

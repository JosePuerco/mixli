import { ScreenHeader } from '../components/ui/ScreenHeader'
import { PlaceholderCard } from '../components/ui/PlaceholderCard'

export function MehrScreen() {
  return (
    <div className="flex flex-col gap-gap-lg">
      <ScreenHeader title="Mehr" />
      <PlaceholderCard text="Hier kommen bald Backup, Kategorien und Infos zur App hin." />
    </div>
  )
}

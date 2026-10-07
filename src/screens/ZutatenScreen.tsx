import { useNavigate } from 'react-router'
import { Screen } from '../components/ui/Screen'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { PlaceholderCard } from '../components/ui/PlaceholderCard'
import { Fab } from '../components/ui/IconButton'

export function ZutatenScreen() {
  const navigate = useNavigate()
  return (
    <>
      <Screen>
        <ScreenHeader title="Zutaten" />
        <PlaceholderCard text="Hier erscheinen bald deine Zutaten mit Foto, Nährwerten und Allergenen." />
      </Screen>
      <Fab aria-label="Neue Zutat" onClick={() => navigate('/zutaten/neu')} />
    </>
  )
}

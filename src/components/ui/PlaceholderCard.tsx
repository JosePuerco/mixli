// Vorläufiger Inhalt für Screens, die in späteren Phasen gebaut werden.
import { Card } from './Card'

interface PlaceholderCardProps {
  text: string
}

export function PlaceholderCard({ text }: PlaceholderCardProps) {
  return (
    <Card appearIndex={0}>
      <p className="text-body font-medium text-text-muted">{text}</p>
    </Card>
  )
}

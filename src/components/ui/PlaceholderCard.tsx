// Vorläufiger Inhalt für Screens, die in späteren Phasen gebaut werden.
interface PlaceholderCardProps {
  text: string
}

export function PlaceholderCard({ text }: PlaceholderCardProps) {
  return <p className="rounded-card bg-surface p-gap-lg text-body font-medium text-text-muted">{text}</p>
}

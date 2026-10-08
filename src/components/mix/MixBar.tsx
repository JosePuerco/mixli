// Anteilsbalken (Müsli-Liste und Detail): ein Abschnitt je Zutat in den Segmentfarben, 3 px Lücke.
import { segmentColor } from './MixRing'

interface MixBarProps {
  /** Anteile 0–1 in der Reihenfolge des Mixes. */
  shares: readonly number[]
  /** Liste 10 px, Detail 12 px. */
  size?: 'md' | 'lg'
}

export function MixBar({ shares, size = 'md' }: MixBarProps) {
  return (
    <div className={`flex gap-0.75 ${size === 'lg' ? 'h-3' : 'h-2.5'}`} aria-hidden="true">
      {shares.map((share, i) => (
        <span
          key={i}
          className="min-w-1 rounded-pill"
          style={{ width: `${share * 100}%`, backgroundColor: segmentColor(i) }}
        />
      ))}
    </div>
  )
}

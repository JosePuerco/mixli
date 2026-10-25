// Hinweis statt Löschen: Die Zutat steckt noch in Müslis oder im Mix in Arbeit.
// Jede Zeile führt dorthin, damit man die Zutat zuerst dort entfernen kann.
import { useNavigate } from 'react-router'
import { BottomSheet } from '../ui/BottomSheet'
import { Button } from '../ui/Button'
import type { IngredientUsage } from '../../db/repo'

interface IngredientInUseSheetProps {
  open: boolean
  onClose: () => void
  usage: IngredientUsage
}

export function IngredientInUseSheet({ open, onClose, usage }: IngredientInUseSheetProps) {
  const navigate = useNavigate()
  const count = usage.mixes.length
  const where = [
    count === 1 ? 'einem gespeicherten Müsli' : count > 1 ? `${count} gespeicherten Müslis` : '',
    usage.inDraft ? 'dem Mix in Arbeit' : '',
  ]
    .filter(Boolean)
    .join(' und ')

  return (
    <BottomSheet open={open} onClose={onClose} title="Zutat wird noch verwendet">
      <p className="px-1 text-body font-medium text-text-muted">
        Sie steckt in {where}. Entferne sie zuerst dort, dann kannst du sie löschen.
      </p>
      <ul className="flex flex-col gap-gap-sm">
        {usage.mixes.map((m) => (
          <li key={m.id}>
            <UsageRow label={m.name} onClick={() => navigate(`/muesli/${m.id}`)} />
          </li>
        ))}
        {usage.inDraft && (
          <li>
            <UsageRow label="Mix in Arbeit" onClick={() => navigate('/mixen')} />
          </li>
        )}
      </ul>
      <div className="pt-1">
        <Button variant="dark" size="md" fullWidth onClick={onClose}>
          Verstanden
        </Button>
      </div>
    </BottomSheet>
  )
}

function UsageRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-13 w-full items-center justify-between gap-gap-md rounded-card bg-surface-muted px-gap-lg py-3 text-left text-body font-semibold text-text"
    >
      <span className="min-w-0 truncate">{label}</span>
      <span className="shrink-0 text-caption text-text-muted">Öffnen</span>
    </button>
  )
}

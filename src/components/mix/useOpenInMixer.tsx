// „Bearbeiten“ und „Duplizieren“: legt das Müsli als Entwurf in „Mixen“ und wechselt dorthin.
// Ist dort gerade eine andere Mischung in Arbeit, wird vorher gefragt, ob sie ersetzt werden soll.
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { duplicateMix, editMix, loadDraft } from '../../db/repo'
import { ConfirmSheet } from '../ui/ConfirmSheet'

type Kind = 'edit' | 'duplicate'

export function useOpenInMixer() {
  const navigate = useNavigate()
  const [pending, setPending] = useState<{ kind: Kind; id: string } | null>(null)

  async function run(kind: Kind, id: string) {
    setPending(null)
    await (kind === 'edit' ? editMix(id) : duplicateMix(id))
    navigate('/mixen')
  }

  async function open(kind: Kind, id: string) {
    const current = await loadDraft()
    // Dieses Müsli wird schon bearbeitet: einfach hinwechseln, nichts überschreiben.
    if (kind === 'edit' && current.mixId === id) {
      navigate('/mixen')
      return
    }
    if (current.items.length > 0 || current.mixId) setPending({ kind, id })
    else await run(kind, id)
  }

  const confirmSheet = (
    <ConfirmSheet
      open={pending !== null}
      onClose={() => setPending(null)}
      title="Aktuelle Mischung ersetzen?"
      text="In „Mixen“ ist noch eine Mischung in Arbeit. Sie wird ersetzt und geht verloren."
      confirmLabel="Ersetzen"
      onConfirm={() => pending && run(pending.kind, pending.id)}
    />
  )

  return { open, confirmSheet }
}

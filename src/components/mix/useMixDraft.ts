// Der Mix in Arbeit für den Mixen-Screen. Quelle der Wahrheit ist der React-State, damit schnelles
// Tippen auf ± nie auf einem veralteten Stand rechnet; jede Änderung wird danach auf dem Gerät gesichert.
import { useCallback, useEffect, useRef, useState } from 'react'
import { loadDraft, saveDraft } from '../../db/repo'
import type { MixDraft } from '../../domain/mixDraft'

export function useMixDraft() {
  const [draft, setDraft] = useState<MixDraft>()
  // Erst nach einer Änderung speichern, nicht direkt nach dem Laden.
  const changed = useRef(false)

  useEffect(() => {
    let alive = true
    loadDraft().then((d) => alive && setDraft(d))
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!draft || !changed.current) return
    saveDraft(draft).catch((e) => console.error('Entwurf nicht gespeichert', e))
  }, [draft])

  const update = useCallback((fn: (d: MixDraft) => MixDraft) => {
    changed.current = true
    setDraft((d) => (d ? fn(d) : d))
  }, [])

  return { draft, update }
}

// Etikett-Sheet im Müsli-Detail (prototypes/MuesliDetail.dc.html): Titel, Format, Vorschau in Originalgröße
// auf grauer Fläche, darunter „Drucken“, „PDF“ und „Als Bild“. Passt der Text selbst klein nicht aufs
// Etikett, steht unter der Vorschau ein Hinweis.
// Drucken: Systemdruck des A4-Bogens (PrintSheet). PDF (Bogen) und Bild (ein Etikett) über das Teilen-Menü.
import { useId, useMemo, useRef, useState } from 'react'
import type { Mix } from '../../db/types'
import { buildLabel, labelFileName, type LabelData } from '../../domain/label'
import { isAbort, isShareBlocked, shareOrDownload } from '../../lib/share'
import { BottomSheet } from '../ui/BottomSheet'
import { Button } from '../ui/Button'
import { FieldError } from '../ui/FieldError'
import { Label, useLabelFit } from './Label'
import { renderLabelPng, renderSheetPdf } from './labelExport'
import { PrintSheet } from './PrintSheet'

interface LabelSheetProps {
  open: boolean
  onClose: () => void
  mix: Mix
}

export function LabelSheet({ open, onClose, mix }: LabelSheetProps) {
  const data = useMemo(() => buildLabel(mix), [mix])

  return (
    <BottomSheet open={open} onClose={onClose} title="Etikett">
      <p className="px-1 text-sm font-medium text-text-muted">70 × 42,3 mm · A4-Bogen mit 21 Etiketten</p>
      {data ? <LabelContent data={data} /> : <p className="px-1 text-body font-medium">Dieses Müsli hat keine Zutaten.</p>}
    </BottomSheet>
  )
}

type ExportKind = 'pdf' | 'png'

const exportText: Record<ExportKind, { idle: string; pending: string; error: string }> = {
  pdf: { idle: 'PDF', pending: 'PDF teilen', error: 'Die PDF konnte nicht erstellt werden.' },
  png: { idle: 'Als Bild', pending: 'Bild teilen', error: 'Das Bild konnte nicht erstellt werden.' },
}

function LabelContent({ data }: { data: LabelData }) {
  const labelRef = useRef<HTMLDivElement>(null)
  const { textSize, fits } = useLabelFit(labelRef, data)
  const errorId = useId()
  const [busy, setBusy] = useState<ExportKind | null>(null)
  /** Fertige Datei, falls das Teilen-Menü einen zweiten Tipp braucht (Safari, siehe isShareBlocked). */
  const [pending, setPending] = useState<{ kind: ExportKind; file: File } | null>(null)
  const [error, setError] = useState<string>()
  const title = `Etikett „${data.name}“`

  async function createFile(kind: ExportKind): Promise<File> {
    const node = labelRef.current
    if (!node) throw new Error('Keine Vorschau zum Zeichnen.')
    const png = await renderLabelPng(node)
    if (kind === 'png') return new File([png], labelFileName(data.name, 'png'), { type: 'image/png' })
    const pdf = await renderSheetPdf(png, title)
    return new File([pdf], labelFileName(data.name, 'pdf'), { type: 'application/pdf' })
  }

  async function exportLabel(kind: ExportKind) {
    setError(undefined)
    setBusy(kind)
    let file = pending?.kind === kind ? pending.file : null
    try {
      file ??= await createFile(kind)
      await shareOrDownload(file, title)
      setPending(null)
    } catch (e) {
      if (isAbort(e)) return
      if (file && isShareBlocked(e)) {
        // Erstellen hat zu lange gedauert: Datei bereithalten, der nächste Tipp teilt sie sofort.
        setPending({ kind, file })
        return
      }
      console.error(e)
      setError(exportText[kind].error)
    } finally {
      setBusy(null)
    }
  }

  function exportButton(kind: ExportKind) {
    return (
      <Button
        variant="muted"
        size="md"
        className="px-2"
        disabled={busy !== null}
        aria-busy={busy === kind}
        aria-describedby={error ? errorId : undefined}
        onClick={() => exportLabel(kind)}
      >
        {busy === kind ? 'Moment …' : pending?.kind === kind ? exportText[kind].pending : exportText[kind].idle}
      </Button>
    )
  }

  return (
    <>
      <div className="flex h-65 items-center justify-center rounded-input bg-surface-muted">
        <Label ref={labelRef} data={data} textSize={textSize} preview />
      </div>
      {!fits && (
        <p role="status" className="px-1 text-sm font-medium text-text-muted">
          Zu viele Zutaten für das Etikett: Ein Teil des Textes ist abgeschnitten.
        </p>
      )}

      <div className="grid grid-cols-3 gap-gap-sm">
        <Button size="md" className="px-2" disabled={busy !== null} onClick={() => window.print()}>
          Drucken
        </Button>
        {exportButton('pdf')}
        {exportButton('png')}
      </div>
      {error && <FieldError id={errorId}>{error}</FieldError>}

      <PrintSheet data={data} textSize={textSize} />
    </>
  )
}

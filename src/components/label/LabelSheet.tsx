// Etikett-Sheet im Müsli-Detail (prototypes/MuesliDetail.dc.html): Titel, Format, Vorschau in Originalgröße
// auf grauer Fläche. Passt der Text selbst klein nicht aufs Etikett, steht darunter ein Hinweis.
import { useMemo, useRef } from 'react'
import type { Mix } from '../../db/types'
import { buildLabel, type LabelData } from '../../domain/label'
import { BottomSheet } from '../ui/BottomSheet'
import { Label, useLabelFit } from './Label'

interface LabelSheetProps {
  open: boolean
  onClose: () => void
  mix: Mix
}

export function LabelSheet({ open, onClose, mix }: LabelSheetProps) {
  const data = useMemo(() => buildLabel(mix), [mix])

  return (
    <BottomSheet open={open} onClose={onClose} title="Etikett">
      <p className="-mt-3 px-1 text-sm font-medium text-text-muted">70 × 42,3 mm · A4-Bogen mit 21 Etiketten</p>
      {data ? <Preview data={data} /> : <p className="px-1 text-body font-medium">Dieses Müsli hat keine Zutaten.</p>}
    </BottomSheet>
  )
}

function Preview({ data }: { data: LabelData }) {
  const labelRef = useRef<HTMLDivElement>(null)
  const { textSize, fits } = useLabelFit(labelRef, data)

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
    </>
  )
}

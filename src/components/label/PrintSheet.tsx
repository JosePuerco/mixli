// Druckbogen: A4 mit 21 gleichen Etiketten an den Positionen aus labelSheet.ts. Auf dem Bildschirm
// unsichtbar; beim Drucken blendet index.css alles andere aus (siehe „Druck“).
import { createPortal } from 'react-dom'
import type { LabelData } from '../../domain/label'
import { LABEL_HEIGHT_MM, PAGE_WIDTH_MM, sheetPositions } from '../../domain/labelSheet'
import { Label } from './Label'

interface PrintSheetProps {
  data: LabelData
  /** Schriftgröße aus der Vorschau, damit der Druck genauso umbricht. */
  textSize: number
}

export function PrintSheet({ data, textSize }: PrintSheetProps) {
  const positions = sheetPositions()
  const bottom = positions[positions.length - 1].y + LABEL_HEIGHT_MM
  return createPortal(
    <div
      className="print-sheet"
      aria-hidden="true"
      style={{
        width: `${PAGE_WIDTH_MM}mm`,
        // Nur bis zur Unterkante der letzten Zeile (296,55 mm), nicht volle 297 mm: Rundet der Browser
        // die Seitenhöhe ab, entstünde sonst eine leere zweite Seite.
        height: `${bottom}mm`,
      }}
    >
      {positions.map((p, i) => (
        <div key={i} className="absolute" style={{ left: `${p.x}mm`, top: `${p.y}mm` }}>
          <Label data={data} textSize={textSize} />
        </div>
      ))}
    </div>,
    document.body,
  )
}

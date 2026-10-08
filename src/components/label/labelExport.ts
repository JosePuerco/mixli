// Etikett als Bild (PNG, 600 dpi) und als PDF (A4-Bogen mit 21 Etiketten).
// html-to-image und jsPDF werden erst beim ersten Export geladen (eigene Chunks); der Service Worker
// speichert sie trotzdem vorab, also klappt beides auch offline.
import { tokens } from '../../design/tokens'
import { EXPORT_PIXEL_RATIO, LABEL_HEIGHT_MM, LABEL_WIDTH_MM, sheetPositions } from '../../domain/labelSheet'

/**
 * Zeichnet das gerenderte Etikett (z. B. die Vorschau) als PNG in Druckauflösung.
 * Rundung und Schatten der Vorschau werden dabei weggelassen.
 */
export async function renderLabelPng(node: HTMLElement): Promise<Blob> {
  const { toBlob } = await import('html-to-image')
  const options = {
    pixelRatio: EXPORT_PIXEL_RATIO,
    backgroundColor: tokens.color.surface,
    style: { borderRadius: '0', boxShadow: 'none' },
  }
  // Safari zeichnet eingebettete Schriften beim ersten Durchlauf oft noch nicht ein – der erste lädt sie nur.
  await toBlob(node, options)
  const blob = await toBlob(node, options)
  if (!blob) throw new Error('Etikett konnte nicht gezeichnet werden.')
  return blob
}

/** A4-PDF mit dem Etikett an allen 21 Positionen des Bogens. Das Bild steckt nur einmal in der Datei. */
export async function renderSheetPdf(png: Blob, title: string): Promise<Blob> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true })
  doc.setProperties({ title, creator: 'Mixli' })
  const data = new Uint8Array(await png.arrayBuffer())
  for (const { x, y } of sheetPositions()) {
    // Gleicher Alias („label“): jsPDF bettet das Bild einmal ein und verweist 21-mal darauf.
    doc.addImage(data, 'PNG', x, y, LABEL_WIDTH_MM, LABEL_HEIGHT_MM, 'label', 'FAST')
  }
  return doc.output('blob')
}

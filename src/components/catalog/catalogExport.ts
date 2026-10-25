// Katalog als A4-PDF: jede Seite (CatalogPages) wird als JPEG gezeichnet und füllt eine PDF-Seite.
// html-to-image und jsPDF werden wie beim Etikett erst beim ersten Export geladen.
import { tokens } from '../../design/tokens'

/** 2 × 96 dpi ≈ 190 dpi: scharf genug für den Druck, Bild pro Seite ca. 0,3–0,6 MB. */
const PIXEL_RATIO = 2
const JPEG_QUALITY = 0.85

export async function renderCatalogPdf(pages: readonly HTMLElement[], title: string): Promise<Blob> {
  const [{ toJpeg }, { jsPDF }] = await Promise.all([import('html-to-image'), import('jspdf')])
  const options = { pixelRatio: PIXEL_RATIO, quality: JPEG_QUALITY, backgroundColor: tokens.color.surface }
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true })
  doc.setProperties({ title, creator: 'Mixli' })
  for (const [i, node] of pages.entries()) {
    if (i > 0) doc.addPage()
    // Safari zeichnet eingebettete Schriften und Bilder beim ersten Durchlauf oft noch nicht ein – der erste
    // lädt sie nur. Schriften reicht das einmal (erste Seite), Fotos braucht es auf jeder Seite mit Foto.
    if (i === 0 || node.querySelector('img')) await toJpeg(node, options)
    doc.addImage(await toJpeg(node, options), 'JPEG', 0, 0, 210, 297, undefined, 'FAST')
  }
  return doc.output('blob')
}

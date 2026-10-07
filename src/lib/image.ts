// Fotos im Browser verkleinern (Canvas), bevor sie in IndexedDB landen.
// Ziel: längste Kante ca. 800 px, WebP – oder JPEG, wenn der Browser kein WebP erzeugen kann (ältere Safari).

export const PHOTO_MAX_EDGE = 800

/** Zielgröße: passt in max × max, Seitenverhältnis bleibt, nie vergrößern. */
export function fitWithin(width: number, height: number, max = PHOTO_MAX_EDGE): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height))
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
}

/**
 * Zwischengrößen beim Verkleinern: jeweils höchstens halbieren.
 * Ein einziger großer Sprung (z. B. 4032 → 800 px) wird auf manchen Geräten pixelig.
 */
export function downscaleSteps(
  from: { width: number; height: number },
  to: { width: number; height: number },
): { width: number; height: number }[] {
  const steps: { width: number; height: number }[] = []
  let { width, height } = from
  while (width / 2 > to.width && height / 2 > to.height) {
    width = Math.round(width / 2)
    height = Math.round(height / 2)
    steps.push({ width, height })
  }
  steps.push(to)
  return steps
}

type Drawable = ImageBitmap | HTMLImageElement

/** Bild laden. createImageBitmap dreht Handyfotos automatisch richtig herum (EXIF). */
async function loadImage(file: Blob): Promise<{ img: Drawable; width: number; height: number; close: () => void }> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
      return { img: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() }
    } catch {
      // Ersatzweg unten (z. B. Formate, die createImageBitmap nicht kennt).
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return { img, width: img.naturalWidth, height: img.naturalHeight, close: () => {} }
  } finally {
    URL.revokeObjectURL(url)
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

/** Verkleinert ein Foto und gibt es als WebP (bzw. JPEG) zurück. */
export async function resizePhoto(file: Blob): Promise<Blob> {
  const { img, width, height, close } = await loadImage(file)
  try {
    const target = fitWithin(width, height)
    let source: CanvasImageSource = img
    let canvas = document.createElement('canvas')
    for (const step of downscaleSteps({ width, height }, target)) {
      canvas = document.createElement('canvas')
      canvas.width = step.width
      canvas.height = step.height
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas nicht verfügbar')
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(source, 0, 0, step.width, step.height)
      source = canvas
    }

    // Kann der Browser kein WebP, liefert toBlob stillschweigend PNG – dann lieber JPEG.
    const webp = await toBlob(canvas, 'image/webp', 0.82)
    if (webp?.type === 'image/webp') return webp
    const jpeg = await toBlob(canvas, 'image/jpeg', 0.85)
    if (!jpeg) throw new Error('Foto konnte nicht umgewandelt werden')
    return jpeg
  } finally {
    close()
  }
}

// Dateien über das Teilen-Menü weitergeben (iCloud Drive, Mail, Drucken …), sonst als Download.
// Genutzt von Backup-Export und Etikett (PDF, Bild).

/** Teilen-Menü vom Nutzer geschlossen – kein Fehler. */
export function isAbort(e: unknown): boolean {
  return e instanceof DOMException && e.name === 'AbortError'
}

/**
 * Safari öffnet das Teilen-Menü nur kurz nach einem Tipp. Hat das Erstellen der Datei zu lange gedauert,
 * kommt dieser Fehler: Datei bereithalten und beim nächsten Tipp sofort teilen.
 */
export function isShareBlocked(e: unknown): boolean {
  return e instanceof DOMException && e.name === 'NotAllowedError'
}

export function download(file: File): void {
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/** Teilt die Datei, wo das Gerät Dateien teilen kann, sonst Download. Fehler (Abbruch, gesperrt) gehen an den Aufrufer. */
export async function shareOrDownload(file: File, title: string): Promise<void> {
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title })
  } else {
    download(file)
  }
}

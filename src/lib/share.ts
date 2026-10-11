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

/** Ob der Tipp noch frisch ist (UserActivation-API; fehlt sie, unbekannt). */
function tapIsFresh(): boolean | undefined {
  return (navigator as { userActivation?: { isActive: boolean } }).userActivation?.isActive
}

/**
 * Teilt die Datei, wo das Gerät Dateien teilen kann, sonst Download. Fehler (Abbruch, gesperrt) gehen an den Aufrufer.
 * Chrome auf Android teilt nur bestimmte Dateitypen (z. B. kein JSON), meldet aber canShare = true und lehnt
 * erst beim Teilen mit NotAllowedError ab – wie Safari bei zu spätem Teilen. War der Tipp noch frisch, liegt es
 * am Dateityp: dann Download. `downloadIfBlocked`: auch sonst Download statt Fehler (zweiter Tipp mit fertiger Datei).
 */
export async function shareOrDownload(file: File, title: string, downloadIfBlocked = false): Promise<void> {
  if (!navigator.canShare?.({ files: [file] })) {
    download(file)
    return
  }
  const fresh = tapIsFresh()
  try {
    await navigator.share({ files: [file], title })
  } catch (e) {
    if (isShareBlocked(e) && (fresh || downloadIfBlocked)) {
      download(file)
      return
    }
    throw e
  }
}

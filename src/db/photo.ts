// Umwandlung zwischen Foto-Datensatz (Bytes + Bildtyp) und Blob für die Anzeige.
import type { Photo } from './types'

/** Blob zum Anzeigen. Liest auch ältere Einträge, die noch einen Blob enthalten. */
export function photoToBlob(photo: Photo | undefined | null): Blob | null {
  if (!photo) return null
  if (photo.data) return new Blob([photo.data], { type: photo.type })
  return photo.blob ?? null
}

/** Blob → Bytes zum Speichern. Muss vor einer Datenbank-Transaktion laufen (siehe repo.saveIngredient). */
export async function blobToPhotoData(blob: Blob): Promise<Pick<Photo, 'data' | 'type'>> {
  return { data: await blob.arrayBuffer(), type: blob.type || 'image/jpeg' }
}

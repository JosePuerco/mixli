// Zeigt ein Foto aus IndexedDB (Blob). Die Object-URL wird beim Wechsel oder Verlassen wieder freigegeben,
// sonst bliebe jedes angezeigte Foto bis zum Schließen der App im Speicher.
import { useEffect, useState } from 'react'

export function usePhotoUrl(blob: Blob | null | undefined): string | undefined {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    if (!blob) {
      setUrl(undefined)
      return
    }
    const next = URL.createObjectURL(blob)
    setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [blob])
  return url
}

interface PhotoViewProps {
  blob: Blob | null | undefined
  /** Leer lassen, wenn der Name daneben steht (Foto ist dann nur Schmuck). */
  alt?: string
  className?: string
}

export function PhotoView({ blob, alt = '', className = '' }: PhotoViewProps) {
  const url = usePhotoUrl(blob)
  if (!url) return null
  return <img src={url} alt={alt} draggable={false} className={`size-full object-cover ${className}`} />
}

// Foto des fertigen Müslis im Detail (für den Katalog). Anders als bei Zutaten wird es sofort gespeichert,
// denn das Detail hat keinen Speichern-Button.
import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { PhotoPicker } from '../ingredient/PhotoPicker'
import { CardTitle } from '../ui/Card'
import { db } from '../../db/db'
import { photoToBlob } from '../../db/photo'
import { setMixPhoto } from '../../db/repo'
import type { Mix } from '../../db/types'

export function MixPhotoSection({ mix }: { mix: Mix }) {
  const photo = useLiveQuery(() => (mix.photoId ? db.photos.get(mix.photoId) : undefined), [mix.photoId])
  const blob = useMemo(() => photoToBlob(photo), [photo])
  const [error, setError] = useState<string>()

  async function change(next: Blob | null) {
    setError(undefined)
    try {
      await setMixPhoto(mix.id, next ? { kind: 'set', blob: next } : { kind: 'remove' })
    } catch {
      setError('Das Foto konnte nicht gespeichert werden. Bitte noch einmal versuchen.')
    }
  }

  return (
    <section className="flex flex-col gap-gap-md">
      <div className="px-1">
        <CardTitle aside="für den Katalog">Foto</CardTitle>
      </div>
      <PhotoPicker photo={blob ?? null} onChange={change} alt="Foto des Müslis" />
      {error && (
        <p role="alert" className="text-center text-caption font-semibold text-text">
          {error}
        </p>
      )}
    </section>
  )
}

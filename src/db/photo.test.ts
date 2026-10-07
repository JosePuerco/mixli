import { describe, expect, it } from 'vitest'
import { blobToPhotoData, photoToBlob } from './photo'

describe('blobToPhotoData / photoToBlob', () => {
  it('ergibt nach Hin- und Rückweg denselben Inhalt und Typ', async () => {
    const original = new Blob(['Bilddaten'], { type: 'image/webp' })
    const stored = { id: 'p', createdAt: new Date(), ...(await blobToPhotoData(original)) }
    const back = photoToBlob(stored)
    expect(back?.type).toBe('image/webp')
    expect(await back?.text()).toBe('Bilddaten')
  })

  it('nimmt JPEG an, wenn der Blob keinen Typ hat', async () => {
    expect((await blobToPhotoData(new Blob(['x']))).type).toBe('image/jpeg')
  })

  it('liest ältere Einträge, die noch einen Blob enthalten', async () => {
    const legacy = new Blob(['alt'], { type: 'image/jpeg' })
    const back = photoToBlob({ id: 'p', createdAt: new Date(), blob: legacy } as never)
    expect(await back?.text()).toBe('alt')
  })

  it('gibt ohne Foto null zurück', () => {
    expect(photoToBlob(undefined)).toBeNull()
  })
})

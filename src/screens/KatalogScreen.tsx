// „Katalog erstellen“ (aus „Meine Müslis“): Titel eingeben, Müslis auswählen (A–Z, anfangs alle), dann
// „PDF erstellen“ → Teilen-Menü bzw. Download wie beim Etikett. Die Seiten werden erst beim Erstellen
// gezeichnet (CatalogPages außerhalb des Bildschirms) und danach wieder entfernt.
import { useId, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useLocation, useNavigate } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'motion/react'
import { CatalogPages } from '../components/catalog/CatalogPages'
import { renderCatalogPdf } from '../components/catalog/catalogExport'
import { IconBack, IconCheck } from '../components/icons/Icons'
import { IngredientPhoto } from '../components/ingredient/IngredientCard'
import { Button } from '../components/ui/Button'
import { FieldError } from '../components/ui/FieldError'
import { FlowLayout } from '../components/ui/FlowLayout'
import { IconButton } from '../components/ui/IconButton'
import { bytesToBase64 } from '../backup/base64'
import { db } from '../db/db'
import { photoToBlob } from '../db/photo'
import type { Mix } from '../db/types'
import { press } from '../design/motion'
import {
  CATALOG_TITLE_MAX_LENGTH,
  DEFAULT_CATALOG_TITLE,
  buildCatalog,
  catalogFileName,
  validateCatalogTitle,
  type CatalogData,
} from '../domain/catalog'
import { mixMeta, sortMixes } from '../domain/mixList'
import { isAbort, isShareBlocked, shareOrDownload } from '../lib/share'

/** Zurück dorthin, wo man herkam (die Liste); bei direktem Aufruf zur Liste. */
function useGoBack() {
  const navigate = useNavigate()
  const location = useLocation()
  return () => (location.key === 'default' ? navigate('/muesli', { replace: true }) : navigate(-1))
}

export function KatalogScreen() {
  const mixes = useLiveQuery(() => db.mixes.toArray(), [])
  if (mixes === undefined) return null
  return <CatalogForm mixes={sortMixes(mixes, 'az')} />
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <IconButton aria-label="Zurück" onClick={onBack}>
        <IconBack size={20} strokeWidth={1.8} />
      </IconButton>
      <h1 className="text-label font-semibold text-text-muted">Katalog erstellen</h1>
      <span className="w-11" aria-hidden="true" />
    </div>
  )
}

/** Foto-id → Data-URL. Eingebettet statt Object-URL, damit html-to-image beim Zeichnen nichts nachlädt. */
async function loadPhotoUrls(catalog: CatalogData): Promise<Map<string, string>> {
  const ids = catalog.entries.flatMap((e) => (e.photoId ? [e.photoId] : []))
  const photos = await db.photos.bulkGet(ids)
  const urls = new Map<string, string>()
  for (const photo of photos) {
    const blob = photoToBlob(photo)
    if (photo && blob) urls.set(photo.id, `data:${blob.type};base64,${bytesToBase64(await blob.arrayBuffer())}`)
  }
  return urls
}

function CatalogForm({ mixes }: { mixes: Mix[] }) {
  const goBack = useGoBack()
  const titleId = useId()
  const titleErrorId = useId()
  const errorId = useId()
  const [title, setTitle] = useState(DEFAULT_CATALOG_TITLE)
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set(mixes.map((m) => m.id)))
  const [showErrors, setShowErrors] = useState(false)
  const [busy, setBusy] = useState(false)
  /** Fertige Datei, falls das Teilen-Menü einen zweiten Tipp braucht (Safari, siehe isShareBlocked). */
  const [pending, setPending] = useState<File | null>(null)
  const [error, setError] = useState<string>()
  const [drawing, setDrawing] = useState<{ catalog: CatalogData; photos: Map<string, string> } | null>(null)
  const pagesRef = useRef<HTMLDivElement>(null)

  const chosen = mixes.filter((m) => selected.has(m.id))
  const titleError = showErrors ? validateCatalogTitle(title) : undefined

  function changeSelection(next: ReadonlySet<string>) {
    setSelected(next)
    setPending(null)
  }

  function toggle(id: string) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    changeSelection(next)
  }

  async function createFile(): Promise<File> {
    const catalog = buildCatalog(title, chosen, new Date())
    const photos = await loadPhotoUrls(catalog)
    // Seiten sofort zeichnen, damit sie gleich danach im DOM stehen.
    flushSync(() => setDrawing({ catalog, photos }))
    try {
      const container = pagesRef.current
      if (!container) throw new Error('Keine Seiten zum Zeichnen.')
      await Promise.all([...container.querySelectorAll('img')].map((img) => img.decode().catch(() => undefined)))
      const pdf = await renderCatalogPdf([...container.children] as HTMLElement[], catalog.title)
      return new File([pdf], catalogFileName(catalog.title), { type: 'application/pdf' })
    } finally {
      setDrawing(null)
    }
  }

  async function exportPdf() {
    if (validateCatalogTitle(title)) {
      setShowErrors(true)
      document.getElementById(titleId)?.focus()
      return
    }
    setError(undefined)
    setBusy(true)
    let file = pending
    const isRetry = file !== null
    try {
      file ??= await createFile()
      await shareOrDownload(file, title.trim(), isRetry)
      setPending(null)
    } catch (e) {
      if (isAbort(e)) return
      if (file && isShareBlocked(e)) {
        // Erstellen hat zu lange gedauert: Datei bereithalten, der nächste Tipp teilt sie sofort.
        setPending(file)
        return
      }
      console.error(e)
      setError('Der Katalog konnte nicht erstellt werden. Bitte noch einmal versuchen.')
    } finally {
      setBusy(false)
    }
  }

  const count = chosen.length
  const buttonText = busy
    ? 'Katalog wird erstellt …'
    : pending
      ? 'PDF teilen'
      : count === 1
        ? 'PDF erstellen (1 Müsli)'
        : `PDF erstellen (${count} Müslis)`

  return (
    <>
      <FlowLayout
        header={<Header onBack={goBack} />}
        footer={
          <div className="flex flex-col gap-gap-sm">
            {pending && !busy && (
              <p role="status" className="text-center text-caption font-semibold text-text">
                Fertig – tippe noch einmal auf „PDF teilen“.
              </p>
            )}
            {error && (
              <FieldError id={errorId} className="justify-center">
                {error}
              </FieldError>
            )}
            <Button
              fullWidth
              onClick={exportPdf}
              disabled={busy || count === 0}
              aria-busy={busy}
              aria-describedby={error ? errorId : undefined}
            >
              {buttonText}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-7">
          <div className="flex flex-col gap-1 px-1">
            <h2 className="text-h1">Katalog als PDF</h2>
            <p className="text-sm font-medium text-text-muted">
              Titelseite mit Übersicht, danach ein Müsli pro A4-Seite mit Foto, Zutaten, Allergenen und Nährwerten.
              Preise, „für wen“ und Notizen stehen nicht drin.
            </p>
          </div>

          <div className="rounded-card bg-surface px-gap-lg py-1.5">
            <label htmlFor={titleId} className="flex flex-col gap-0.5 py-2.5">
              <span className="text-caption font-semibold text-text-muted">Titel</span>
              <input
                id={titleId}
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  setPending(null)
                }}
                placeholder="z. B. Müsli-Sortiment Herbst"
                maxLength={CATALOG_TITLE_MAX_LENGTH}
                autoComplete="off"
                enterKeyHint="done"
                aria-invalid={titleError ? true : undefined}
                aria-describedby={titleError ? titleErrorId : undefined}
                className="w-full bg-transparent py-1 text-body-large font-semibold text-text outline-none placeholder:text-text-placeholder"
              />
              {titleError && (
                <FieldError id={titleErrorId} className="pb-1">
                  {titleError}
                </FieldError>
              )}
            </label>
          </div>

          <section className="flex flex-col gap-gap-md" aria-label="Müslis im Katalog">
            <div className="flex items-center justify-between gap-gap-md px-1">
              <h2 className="text-label">
                Müslis · {count} von {mixes.length}
              </h2>
              <div className="flex gap-gap-sm">
                <Button variant="surface" size="compact" onClick={() => changeSelection(new Set(mixes.map((m) => m.id)))}>
                  Alle
                </Button>
                <Button variant="surface" size="compact" onClick={() => changeSelection(new Set())}>
                  Keine
                </Button>
              </div>
            </div>

            {mixes.length === 0 ? (
              <p className="px-1 text-sm font-medium text-text-muted">Noch keine Müslis gespeichert.</p>
            ) : (
              <ul className="flex flex-col gap-gap-sm">
                {mixes.map((m) => (
                  <li key={m.id}>
                    <MixCheckRow mix={m} checked={selected.has(m.id)} onToggle={() => toggle(m.id)} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </FlowLayout>

      {drawing && <CatalogPages ref={pagesRef} catalog={drawing.catalog} photos={drawing.photos} />}
    </>
  )
}

function MixCheckRow({ mix, checked, onToggle }: { mix: Mix; checked: boolean; onToggle: () => void }) {
  return (
    <motion.button
      type="button"
      role="checkbox"
      aria-checked={checked}
      {...press}
      onClick={onToggle}
      className="flex min-h-16 w-full items-center gap-gap-md rounded-card bg-surface p-2.5 pr-gap-lg text-left"
    >
      <IngredientPhoto id={mix.id} photoId={mix.photoId} className="size-12 shrink-0 rounded-photo" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-body font-bold">{mix.name}</span>
        <span className="truncate text-caption text-text-muted">{mix.photoId ? mixMeta(mix) : `${mixMeta(mix)} · ohne Foto`}</span>
      </span>
      <span
        aria-hidden="true"
        className={`flex size-7 shrink-0 items-center justify-center rounded-pill border-[1.5px] transition-colors ${
          checked ? 'border-accent bg-accent text-on-accent' : 'border-border bg-surface text-transparent'
        }`}
      >
        <IconCheck size={16} strokeWidth={2.4} />
      </span>
    </motion.button>
  )
}

// Katalogseiten in A4 (794 × 1123 CSS-px = 210 × 297 mm bei 96 dpi), nur zum Zeichnen fürs PDF.
// Titelseite: Titel, Datum, Übersicht mit Seitenzahlen. Müsli-Seite: Foto (füllt den freien Platz, fehlt es,
// rückt der Text nach oben), Name, Zutaten mit Anteilen, „Enthält:“ (nur das Wort fett), Spuren, Nährwerttabelle.
// Die Seiten liegen außerhalb des Bildschirms; catalogExport.ts zeichnet sie einzeln als Bild.
import type { ReactNode, Ref } from 'react'
import { pageLabel, type CatalogData, type CatalogEntry } from '../../domain/catalog'

export const PAGE_WIDTH_PX = 794
export const PAGE_HEIGHT_PX = 1123

interface CatalogPagesProps {
  catalog: CatalogData
  /** Foto-id → Data-URL (eingebettet, damit das Zeichnen nichts nachladen muss). */
  photos: ReadonlyMap<string, string>
  ref?: Ref<HTMLDivElement>
}

/** Alle Seiten untereinander; jedes Kind des Containers ist eine Seite. */
export function CatalogPages({ catalog, photos, ref }: CatalogPagesProps) {
  return (
    <div ref={ref} aria-hidden="true" className="pointer-events-none fixed top-0 -left-[10000px] flex flex-col">
      <TitlePage catalog={catalog} />
      {catalog.entries.map((e) => (
        <MixPage key={e.mixId} entry={e} catalog={catalog} photo={e.photoId ? photos.get(e.photoId) : undefined} />
      ))}
    </div>
  )
}

function Page({ children, footer }: { children: ReactNode; footer: ReactNode }) {
  return (
    <section
      className="flex shrink-0 flex-col gap-8 bg-surface px-16 pt-16 pb-12 text-text"
      style={{ width: PAGE_WIDTH_PX, height: PAGE_HEIGHT_PX }}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-8">{children}</div>
      <div className="flex shrink-0 items-baseline justify-between gap-6 border-t border-divider pt-4 text-[13px] font-medium text-text-muted">
        {footer}
      </div>
    </section>
  )
}

function TitlePage({ catalog }: { catalog: CatalogData }) {
  const count = catalog.entries.length
  return (
    <Page
      footer={
        <>
          <span>Erstellt mit Mixli</span>
          <span>{pageLabel(1, catalog.pageCount)}</span>
        </>
      }
    >
      <div className="flex flex-col gap-5 pt-24">
        <span className="h-1.5 w-20 rounded-pill bg-accent" />
        <h1 className="text-[52px] leading-[1.1] font-extrabold tracking-tight">{catalog.title}</h1>
        <p className="text-[18px] font-medium text-text-muted">
          {catalog.date} · {count === 1 ? '1 Müsli' : `${count} Müslis`}
        </p>
      </div>
      <ol className="mt-8 flex flex-col">
        {catalog.entries.map((e) => (
          <li key={e.mixId} className="flex items-baseline gap-6 border-b border-divider py-3.5 text-[18px]">
            <span className="min-w-0 flex-1 font-semibold">{e.name}</span>
            <span className="shrink-0 text-[15px] font-medium text-text-muted">Seite {e.page}</span>
          </li>
        ))}
      </ol>
    </Page>
  )
}

function MixPage({ entry, catalog, photo }: { entry: CatalogEntry; catalog: CatalogData; photo?: string }) {
  return (
    <Page
      footer={
        <>
          <span className="min-w-0 truncate">{catalog.title}</span>
          <span className="shrink-0">{pageLabel(entry.page, catalog.pageCount)}</span>
        </>
      }
    >
      {photo && (
        <div className="min-h-50 flex-1 overflow-hidden rounded-card bg-photo-1">
          <img src={photo} alt="" className="size-full object-cover" />
        </div>
      )}
      <h2 className="shrink-0 text-[38px] leading-[1.15] font-extrabold tracking-tight">{entry.name}</h2>

      <div className="flex shrink-0 flex-col gap-3 text-[16px] leading-[1.5] font-medium">
        <p>
          <b className="font-extrabold">Zutaten:</b>{' '}
          {entry.ingredients.map((i) => `${i.name} (${i.share})`).join(', ')}
        </p>
        {entry.contains.length > 0 && (
          <p>
            <b className="font-extrabold">Enthält:</b> {entry.contains.join(', ')}.
          </p>
        )}
        {entry.traces && <p>{entry.traces}</p>}
      </div>

      <div className="flex shrink-0 flex-col rounded-card bg-surface-muted px-7 py-5">
        <div className="flex items-baseline justify-between pb-2 text-[16px] font-bold">
          <span>Nährwerte</span>
          <span className="text-[14px] font-medium text-text-muted">pro 100 g</span>
        </div>
        {entry.nutrition.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-6 border-t border-divider py-2 text-[15px]">
            <span className={row.sub ? 'pl-5 font-medium text-text-muted' : 'font-semibold'}>{row.label}</span>
            <span className="font-bold tabular-nums">{row.value}</span>
          </div>
        ))}
      </div>
    </Page>
  )
}

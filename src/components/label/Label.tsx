// Etikett 70 × 42,3 mm nach design/DESIGN.md („Etikett“) und prototypes/Etikett.dc.html:
// Kopfzeile Name links, Gesamtmenge rechts, Linie darunter; links Zutaten, „Enthält: …“ (fett), Spuren,
// Datum und Hinweis, rechts die Nährwerttabelle. Nur Schwarz auf Weiß. Maße in mm, Schrift in px (7 px ≈ 5 pt), damit
// Vorschau, Druck, PDF und Bild gleich aussehen.
// Zu viel Text: useLabelFit wählt die erste Stufe aus LAYOUT_STAGES, bei der alles passt – Allergene und
// Spuren rutschen dabei unter die Nährwerttabelle, damit sie nie abgeschnitten werden.
import { Fragment, useLayoutEffect, useState, type CSSProperties, type Ref, type RefObject } from 'react'
import type { LabelData } from '../../domain/label'
import { LABEL_SOURCE_NOTE } from '../../domain/label'
import { LABEL_HEIGHT_MM, LABEL_WIDTH_MM } from '../../domain/labelSheet'

export interface LabelLayout {
  /** Schriftgröße des Fließtexts in px. */
  textSize: number
  /** Allergene, Spuren, Datum und Hinweis unter der Nährwerttabelle statt unter den Zutaten. */
  notesRight: boolean
  /** Breitere Zutatenspalte (124 statt 104 px), Nährwerttabelle entsprechend schmaler. */
  wide: boolean
}

/**
 * Stufen bei Platzmangel, in dieser Reihenfolge: Schrift 7 → 6 px, dann Allergene, Spuren und Datum nach
 * rechts, dann bis 5,5 px. Ab 6 px wird je Schriftgröße erst die normale, dann die breitere Zutatenspalte
 * probiert – breiter nur, wenn es links eng ist (rechts wird es dadurch schmaler).
 */
export const LAYOUT_STAGES: readonly LabelLayout[] = [
  ...[7, 6.75, 6.5, 6.25, 6].map((textSize) => ({ textSize, notesRight: false, wide: false })),
  ...[6, 5.75, 5.5].flatMap((textSize) => [
    { textSize, notesRight: true, wide: false },
    { textSize, notesRight: true, wide: true },
  ]),
]

export const DEFAULT_LAYOUT = LAYOUT_STAGES[0]

/** Überträgt eine Stufe aufs Etikett: als CSS-Variable und Daten-Attribute (siehe Label). */
function layoutAttributes({ textSize, notesRight, wide }: LabelLayout) {
  return {
    '--label-text': `${textSize}px`,
    'data-notes': notesRight ? 'right' : 'left',
    'data-wide': wide ? 'true' : 'false',
  }
}

interface LabelProps {
  data: LabelData
  layout?: LabelLayout
  /** Schatten und Rundung für die Vorschau; ohne für Druck, PDF und Bild. */
  preview?: boolean
  ref?: Ref<HTMLDivElement>
}

export function Label({ data, layout = DEFAULT_LAYOUT, preview = false, ref }: LabelProps) {
  const { '--label-text': textSize, ...dataAttributes } = layoutAttributes(layout)
  // Allergene, Spuren, Datum und Hinweis stehen zweimal im DOM; data-notes blendet eine Stelle aus.
  const notes = (
    <>
      {data.contains.length > 0 && <p className="font-extrabold">Enthält: {data.contains.join(', ')}.</p>}
      {data.traces && <p>{data.traces}</p>}
      <p>
        {data.madeOn} {LABEL_SOURCE_NOTE}
      </p>
    </>
  )

  return (
    <div
      ref={ref}
      lang="de"
      {...dataAttributes}
      className={`group/label flex shrink-0 flex-col gap-[5px] overflow-hidden bg-surface px-[9px] py-[8px] text-text ${
        preview ? 'rounded-[6px] shadow-label-preview' : ''
      }`}
      style={
        {
          width: `${LABEL_WIDTH_MM}mm`,
          height: `${LABEL_HEIGHT_MM}mm`,
          '--label-text': textSize,
        } as CSSProperties
      }
    >
      <div className="flex items-baseline justify-between gap-2 border-b border-text pb-[3px] text-[11px] leading-tight font-extrabold">
        <span className="min-w-0 truncate">{data.name}</span>
        <span className="shrink-0">{data.total}</span>
      </div>

      <div className="flex min-h-0 flex-1 gap-[8px] text-[length:var(--label-text)]">
        <div
          data-label-fit
          className="flex min-h-0 w-[104px] shrink-0 flex-col gap-[4px] overflow-hidden leading-[1.3] hyphens-auto break-words group-data-[wide=true]/label:w-[124px]"
        >
          <p>
            <b className="font-extrabold">Zutaten:</b>{' '}
            {data.ingredients.map((i, n) => (
              <Fragment key={n}>
                {i.name} {i.share}
                {n < data.ingredients.length - 1 ? ', ' : '.'}
              </Fragment>
            ))}
          </p>
          <div className="flex flex-col gap-[4px] group-data-[notes=right]/label:hidden">{notes}</div>
        </div>

        <div data-label-fit className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <dl className="flex flex-col leading-[1.15]">
            <div className="flex justify-between gap-1 border-b border-text pb-[1.5px] font-extrabold">
              <dt>Nährwerte</dt>
              <dd>pro 100 g</dd>
            </div>
            {data.nutrition.map((row, n) => (
              <div key={row.label} className={`flex justify-between gap-1 ${n === 0 ? 'pt-[1.5px]' : ''} ${row.sub ? 'pl-[5px]' : ''}`}>
                <dt className="min-w-0 truncate">{row.label}</dt>
                <dd className="shrink-0">{row.value}</dd>
              </div>
            ))}
          </dl>
          <div className="hidden flex-col gap-[4px] pt-[5px] leading-[1.3] hyphens-auto break-words group-data-[notes=right]/label:flex">
            {notes}
          </div>
        </div>
      </div>
    </div>
  )
}

export interface LabelFit {
  layout: LabelLayout
  /** false: Selbst in der letzten Stufe passt nicht alles aufs Etikett. */
  fits: boolean
}

/**
 * Sucht die erste Stufe aus LAYOUT_STAGES, bei der alles vollständig aufs Etikett passt.
 * Misst am gerenderten Etikett (ref); läuft erneut, wenn sich die Daten ändern oder die Schrift geladen ist.
 */
export function useLabelFit(ref: RefObject<HTMLDivElement | null>, data: LabelData | null): LabelFit {
  const [fit, setFit] = useState<LabelFit>({ layout: DEFAULT_LAYOUT, fits: true })

  useLayoutEffect(() => {
    let cancelled = false

    function apply(el: HTMLElement, layout: LabelLayout) {
      for (const [name, value] of Object.entries(layoutAttributes(layout))) {
        if (name.startsWith('--')) el.style.setProperty(name, value)
        else el.setAttribute(name, value)
      }
    }

    function measure() {
      const el = ref.current
      if (!el || cancelled) return
      const columns = [...el.querySelectorAll<HTMLElement>('[data-label-fit]')]
      const lines = columns.map((c) => [...c.querySelectorAll<HTMLElement>('p, dl > div')])
      const paddingBottom = parseFloat(getComputedStyle(el).paddingBottom) || 0
      // Gemessen wird, was sichtbar ist: Jeder Absatz und jede Tabellenzeile muss innerhalb seiner Spalte
      // und innerhalb des Etiketts enden. Mit scrollHeight allein blieben auf dem iPhone (Safari 18)
      // abgeschnittene Spuren unbemerkt.
      const overflows = () => {
        const labelBottom = el.getBoundingClientRect().bottom - paddingBottom
        return columns.some((column, i) => {
          if (column.scrollHeight > column.clientHeight + 0.5) return true
          const bottom = Math.min(column.getBoundingClientRect().bottom, labelBottom) + 0.5
          // Ausgeblendete Absätze (data-notes) haben keine Boxen und zählen nicht.
          return lines[i].some((line) => line.getClientRects().length > 0 && line.getBoundingClientRect().bottom > bottom)
        })
      }
      // Ohne passende Stufe bleibt die letzte (kleinste) stehen.
      let layout = LAYOUT_STAGES[LAYOUT_STAGES.length - 1]
      let fits = false
      for (const stage of LAYOUT_STAGES) {
        apply(el, stage)
        if (!overflows()) {
          layout = stage
          fits = true
          break
        }
      }
      apply(el, layout)
      setFit((prev) => (prev.layout === layout && prev.fits === fits ? prev : { layout, fits }))
    }

    measure()
    // Bis Manrope geladen ist, misst der Browser mit der Ersatzschrift – danach noch einmal.
    document.fonts?.ready.then(measure)
    return () => {
      cancelled = true
    }
  }, [ref, data])

  return fit
}

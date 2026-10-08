// Etikett 70 × 42,3 mm nach design/DESIGN.md („Etikett“) und prototypes/Etikett.dc.html:
// Kopfzeile Name links, Gesamtmenge rechts, Linie darunter; links Zutaten, Spuren, Datum und Hinweis,
// rechts die Nährwerttabelle. Nur Schwarz auf Weiß. Maße in mm, Schrift in px (7 px ≈ 5 pt), damit
// Vorschau, Druck, PDF und Bild gleich aussehen. Zu viel Text: useLabelFit verkleinert die Schrift.
import { Fragment, useLayoutEffect, useState, type CSSProperties, type Ref, type RefObject } from 'react'
import type { LabelData } from '../../domain/label'
import { LABEL_SOURCE_NOTE } from '../../domain/label'
import { LABEL_HEIGHT_MM, LABEL_WIDTH_MM } from '../../domain/labelSheet'

/** Schriftgröße des Fließtexts in px: Vorgabe 7 px, bei Platzmangel schrittweise bis 5,5 px. */
export const LABEL_TEXT_MAX = 7
export const LABEL_TEXT_MIN = 5.5
const LABEL_TEXT_STEP = 0.25

interface LabelProps {
  data: LabelData
  /** Schriftgröße des Fließtexts in px (aus useLabelFit). */
  textSize?: number
  /** Schatten und Rundung für die Vorschau; ohne für Druck, PDF und Bild. */
  preview?: boolean
  ref?: Ref<HTMLDivElement>
}

export function Label({ data, textSize = LABEL_TEXT_MAX, preview = false, ref }: LabelProps) {
  return (
    <div
      ref={ref}
      lang="de"
      className={`flex shrink-0 flex-col gap-[5px] overflow-hidden bg-surface px-[9px] py-[8px] text-text ${
        preview ? 'rounded-[6px] shadow-label-preview' : ''
      }`}
      style={
        {
          width: `${LABEL_WIDTH_MM}mm`,
          height: `${LABEL_HEIGHT_MM}mm`,
          '--label-text': `${textSize}px`,
        } as CSSProperties
      }
    >
      <div className="flex items-baseline justify-between gap-2 border-b border-text pb-[3px] text-[11px] leading-tight font-extrabold">
        <span className="min-w-0 truncate">{data.name}</span>
        <span className="shrink-0">{data.total}</span>
      </div>

      <div className="flex min-h-0 flex-1 gap-[8px] text-[length:var(--label-text)]">
        <div data-label-fit className="flex min-h-0 w-[104px] shrink-0 flex-col gap-[4px] overflow-hidden leading-[1.3] hyphens-auto break-words">
          <p>
            <b className="font-extrabold">Zutaten:</b>{' '}
            {data.ingredients.map((i, n) => (
              <Fragment key={n}>
                {i.name}
                {i.allergens.length > 0 && (
                  <>
                    {' '}(<b className="font-extrabold">{i.allergens.join(', ')}</b>)
                  </>
                )}{' '}
                {i.share}
                {n < data.ingredients.length - 1 ? ', ' : '.'}
              </Fragment>
            ))}
          </p>
          {data.traces && <p>{data.traces}</p>}
          <p>
            {data.madeOn} {LABEL_SOURCE_NOTE}
          </p>
        </div>

        <dl data-label-fit className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden leading-[1.15]">
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
      </div>
    </div>
  )
}

export interface LabelFit {
  textSize: number
  /** false: Selbst in der kleinsten Schrift passt nicht alles aufs Etikett. */
  fits: boolean
}

/**
 * Sucht die größte Schrift (7 → 5,5 px), bei der Zutaten und Nährwerte vollständig aufs Etikett passen.
 * Misst am gerenderten Etikett (ref); läuft erneut, wenn sich die Daten ändern oder die Schrift geladen ist.
 */
export function useLabelFit(ref: RefObject<HTMLDivElement | null>, data: LabelData | null): LabelFit {
  const [fit, setFit] = useState<LabelFit>({ textSize: LABEL_TEXT_MAX, fits: true })

  useLayoutEffect(() => {
    let cancelled = false

    function measure() {
      const el = ref.current
      if (!el || cancelled) return
      const columns = [...el.querySelectorAll<HTMLElement>('[data-label-fit]')]
      const overflows = () => columns.some((c) => c.scrollHeight > c.clientHeight + 0.5)
      let size = LABEL_TEXT_MAX
      el.style.setProperty('--label-text', `${size}px`)
      while (overflows() && size > LABEL_TEXT_MIN) {
        size -= LABEL_TEXT_STEP
        el.style.setProperty('--label-text', `${size}px`)
      }
      const fits = !overflows()
      setFit((prev) => (prev.textSize === size && prev.fits === fits ? prev : { textSize: size, fits }))
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

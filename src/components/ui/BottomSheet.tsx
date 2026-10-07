// Bottom-Sheet nach design/DESIGN.md: weiß, Radius oben 28, Griff 40 × 5 px, Overlay rgba(28,28,26,.35).
// Fährt von unten herein (420 ms), Overlay blendet ein (250 ms).
// Schließen: Tipp auf den Hintergrund, Escape, oder am Griff nach unten ziehen.
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useDragControls, useReducedMotion, type PanInfo } from 'motion/react'
import { overlayTransition, sheetTransition } from '../../design/motion'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  /** Sheet-Titel (20/700). Ohne Titel unbedingt aria-label setzen. */
  title?: string
  'aria-label'?: string
  /** Aktion rechts neben dem Titel, z. B. „Fertig“. */
  headerAction?: ReactNode
  /** Beschriftung des Hintergrunds für Screenreader: „Schließen“ oder „Abbrechen“. */
  closeLabel?: string
  children: ReactNode
}

/** Ab so viel Zug nach unten (px) oder Geschwindigkeit (px/s) schließt das Sheet. */
const DISMISS_OFFSET = 120
const DISMISS_VELOCITY = 600

export function BottomSheet({
  open,
  onClose,
  title,
  headerAction,
  closeLabel = 'Schließen',
  children,
  ...rest
}: BottomSheetProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const dragControls = useDragControls()
  // „Bewegung reduzieren“: Sheet erscheint und verschwindet sofort, auch ohne Einblenden.
  const reduceMotion = useReducedMotion()
  const instant = { duration: 0 }
  // Aktuelles onClose merken, damit der Effekt nicht bei jeder neuen Funktion neu läuft.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  // Escape schließt; der Rest der App ist solange für Tastatur und Screenreader gesperrt.
  useEffect(() => {
    if (!open) return
    const previousFocus = document.activeElement as HTMLElement | null
    const root = document.getElementById('root')
    root?.setAttribute('inert', '')
    panelRef.current?.focus()

    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current()
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      root?.removeAttribute('inert')
      previousFocus?.focus?.()
    }
  }, [open])

  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.y > DISMISS_OFFSET || info.velocity.y > DISMISS_VELOCITY) onClose()
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.button
            type="button"
            aria-label={closeLabel}
            tabIndex={-1}
            onClick={onClose}
            className="absolute inset-0 size-full cursor-default bg-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: reduceMotion ? instant : overlayTransition }}
            exit={{ opacity: 0, transition: reduceMotion ? instant : overlayTransition }}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-label={title ? undefined : rest['aria-label']}
            tabIndex={-1}
            className="sheet-panel absolute inset-x-0 bottom-0 mx-auto flex max-w-lg flex-col rounded-t-sheet bg-surface outline-none"
            initial={{ y: '100%' }}
            animate={{ y: 0, transition: reduceMotion ? instant : sheetTransition.enter }}
            exit={{ y: '100%', transition: reduceMotion ? instant : sheetTransition.exit }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={onDragEnd}
          >
            {/* Griffbereich: hier lässt sich das Sheet nach unten wegziehen. */}
            <div
              className="flex shrink-0 cursor-grab touch-none flex-col gap-3.5 px-screen pt-3 pb-3.5"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="mx-auto h-1.25 w-10 rounded-pill bg-border" aria-hidden="true" />
              {(title || headerAction) && (
                <div className="flex min-h-touch items-center justify-between gap-gap-md px-1">
                  {title && (
                    <h2 id={titleId} className="text-h2">
                      {title}
                    </h2>
                  )}
                  {headerAction}
                </div>
              )}
            </div>
            <div className="sheet-body flex flex-col gap-3.5 px-screen">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

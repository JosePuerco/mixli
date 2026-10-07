// Ganzseitiger Ablauf ohne Navigation (z. B. „Zutat anlegen“, „Zutat bearbeiten“):
// feste Kopfzeile, scrollender Inhalt, feste Fußzeile mit der Haupt-Aktion.
import type { ReactNode, Ref } from 'react'

interface FlowLayoutProps {
  header: ReactNode
  footer: ReactNode
  children: ReactNode
  /** Zugriff auf den Scrollbereich, z. B. um bei Schrittwechsel nach oben zu springen. */
  bodyRef?: Ref<HTMLElement>
}

export function FlowLayout({ header, footer, children, bodyRef }: FlowLayoutProps) {
  return (
    <div className="absolute inset-0 flex flex-col">
      <div className="flow-header flex shrink-0 flex-col gap-3.5">{header}</div>
      <main ref={bodyRef} className="flow-body flex-1">
        {children}
      </main>
      <div className="flow-footer shrink-0">{footer}</div>
    </div>
  )
}

interface FlowTitleProps {
  title: string
  text: string
  /** Für Fokus nach dem Schrittwechsel (Screenreader liest dann den neuen Titel). */
  titleRef?: Ref<HTMLHeadingElement>
}

/** Titel eines Schritts (26/700) mit gedämpftem Hinweis darunter. */
export function FlowTitle({ title, text, titleRef }: FlowTitleProps) {
  return (
    <div className="flex flex-col gap-1 px-1">
      <h1 ref={titleRef} tabIndex={-1} className="text-h1 outline-none">
        {title}
      </h1>
      <p className="text-sm font-medium text-text-muted">{text}</p>
    </div>
  )
}

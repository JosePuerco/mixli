// Scrollbarer Inhaltsbereich eines Screens. Füllt die feste App-Hülle aus;
// scrollt nur, wenn der Inhalt länger ist (siehe Utility screen-scroll in index.css).
import type { ReactNode } from 'react'

interface ScreenProps {
  children: ReactNode
}

export function Screen({ children }: ScreenProps) {
  return (
    <main className="screen-scroll absolute inset-0">
      <div className="flex flex-col gap-gap-lg">{children}</div>
    </main>
  )
}

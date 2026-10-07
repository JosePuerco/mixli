// Screen-Titel (h1, 26/700) mit optionaler Zeile darüber, z. B. „7 Zutaten“.
import type { ReactNode } from 'react'

interface ScreenHeaderProps {
  title: string
  eyebrow?: string
  action?: ReactNode
}

export function ScreenHeader({ title, eyebrow, action }: ScreenHeaderProps) {
  return (
    <header className="flex items-end justify-between gap-gap-md px-1">
      <div className="flex flex-col gap-0.5">
        {eyebrow && <span className="text-label font-normal text-text-muted">{eyebrow}</span>}
        <h1 className="text-h1">{title}</h1>
      </div>
      {action}
    </header>
  )
}

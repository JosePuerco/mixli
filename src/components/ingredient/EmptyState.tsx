// Erster Start: illustrierte Schale (schwebt sanft), Flocken rieseln hinein,
// „Willkommen bei Mixli“ und zwei Buttons. Wird gezeigt, solange es keine Zutaten gibt.
// Die Dauerschleifen (Schweben, Rieseln) laufen per CSS (index.css); „Bewegung reduzieren“ hält sie an.
import { motion, useReducedMotion } from 'motion/react'
import { Button } from '../ui/Button'
import { ease } from '../../design/motion'

interface EmptyStateProps {
  onCreate: () => void
  onImport: () => void
}

/** Text und Buttons steigen nacheinander auf (wie im Prototyp, 120 und 240 ms verzögert). */
function rise(delay: number) {
  return {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: ease.out, delay },
  } as const
}

export function EmptyState({ onCreate, onImport }: EmptyStateProps) {
  const reduceMotion = useReducedMotion()
  return (
    <main className="screen-scroll absolute inset-0 flex flex-col items-center justify-center gap-7 px-8 text-center">
      <div className="relative h-45 w-50" aria-hidden="true">
        <span className="flake flake-1 absolute top-1.5 left-17.5 h-2 w-3 rounded-pill bg-segment-3" />
        <span className="flake flake-2 absolute top-0 left-26 size-2.5 rounded-pill bg-segment-2" />
        <span className="flake flake-3 absolute top-2.5 left-32 h-1.75 w-3 rounded-pill bg-segment-5" />
        <div className="bowl-float absolute inset-x-0 bottom-0 flex justify-center">
          <svg width="200" height="120" viewBox="0 0 200 120" fill="none">
            <ellipse cx="100" cy="112" rx="58" ry="6" className="fill-divider" />
            <path d="M20 40h160c0 38-34 66-80 66S20 78 20 40z" className="fill-surface stroke-text" strokeWidth="2.5" />
            <path
              d="M34 40c8-10 20-12 30-6 8-8 22-9 32-2 10-8 26-7 34 2 10-6 24-3 30 6"
              className="stroke-accent"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M44 62c10 14 30 22 56 22s46-8 56-22"
              className="stroke-segment-2"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      <motion.div {...(reduceMotion ? {} : rise(0.12))} className="flex flex-col gap-2.5">
        <h1 className="text-h1-detail tracking-[-0.02em]">Willkommen bei Mixli</h1>
        <p className="text-body-large leading-normal font-medium text-text-muted">
          Lege deine erste Zutat an – mit Foto, Nährwerten und Allergenen. Danach kannst du sofort mixen.
        </p>
      </motion.div>

      <motion.div {...(reduceMotion ? {} : rise(0.24))} className="flex w-full flex-col gap-2.5">
        <Button fullWidth onClick={onCreate}>
          Erste Zutat anlegen
        </Button>
        <Button variant="surface" fullWidth onClick={onImport}>
          Backup importieren
        </Button>
      </motion.div>
    </main>
  )
}

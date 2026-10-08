// Mengen-Sheet: Name der Zutat, große Zahl mit „g“, Schnellwerte 10/25/50 g, Ziffernblock 3 × 4, „Übernehmen“.
// Tippen auf den Hintergrund bricht ab. Mit Tastatur (Laptop): Ziffern, Komma/Punkt, Rücktaste, Enter.
import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { press } from '../../design/motion'
import { amountDisplay, amountInput, amountToGrams, pressKey, type AmountKey } from '../../domain/amountInput'
import { BottomSheet } from '../ui/BottomSheet'
import { Button } from '../ui/Button'

const QUICK = [10, 25, 50] as const
const KEYS: AmountKey[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', 'del']

interface AmountSheetProps {
  open: boolean
  name: string
  grams: number
  onApply: (grams: number) => void
  onClose: () => void
}

export function AmountSheet({ open, name, grams, onApply, onClose }: AmountSheetProps) {
  const [input, setInput] = useState(() => amountInput(grams))
  // Beim Öffnen mit der aktuellen Menge neu beginnen (Zustand während des Zeichnens anpassen statt per Effekt).
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setInput(amountInput(grams))
  }

  const apply = () => onApply(amountToGrams(input))
  const applyRef = useRef(apply)
  useEffect(() => {
    applyRef.current = apply
  })

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      let key: AmountKey | undefined
      if (/^[0-9]$/.test(e.key)) key = e.key as AmountKey
      else if (e.key === ',' || e.key === '.') key = ','
      else if (e.key === 'Backspace') key = 'del'
      else if (e.key === 'Enter') {
        e.preventDefault()
        applyRef.current()
        return
      }
      if (key) {
        e.preventDefault()
        setInput((i) => pressKey(i, key))
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <BottomSheet open={open} onClose={onClose} aria-label={`Menge für ${name}`} closeLabel="Abbrechen">
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-sm font-medium text-text-muted">{name}</span>
        <p className="flex items-baseline gap-1.5" aria-live="polite">
          <span className="text-display tracking-tight">{amountDisplay(input)}</span>
          <span className="text-h2 text-text-muted">g</span>
        </p>
      </div>

      <div className="grid grid-cols-3 gap-gap-sm">
        {QUICK.map((q) => (
          <motion.button
            key={q}
            type="button"
            {...press}
            onClick={() => setInput(amountInput(q))}
            className="h-10 rounded-pill border-[1.5px] border-border bg-surface text-sm font-bold"
          >
            {q} g
          </motion.button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-gap-sm">
        {KEYS.map((k) => (
          <motion.button
            key={k}
            type="button"
            {...press}
            onClick={() => setInput((i) => pressKey(i, k))}
            aria-label={k === 'del' ? 'Löschen' : undefined}
            className="h-14 rounded-keypad-key bg-surface-muted text-h2 font-semibold"
          >
            {k === 'del' ? '⌫' : k}
          </motion.button>
        ))}
      </div>

      <Button fullWidth onClick={apply}>
        Übernehmen
      </Button>
    </BottomSheet>
  )
}

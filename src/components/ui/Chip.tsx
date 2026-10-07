// Chips nach design/DESIGN.md („Chips“) und den Prototypen.
// Auswahl-Chips: weiß, ausgewählt dunkel (Tags: Akzent). Auf weißen Flächen (Sheets) mit Rahmen.
// „+ Neu“-Chips: gestrichelter Rahmen. Allergen-Chips: reine Anzeige, „Spuren“ gestrichelt.
import type { ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'motion/react'
import { chipIn, press } from '../../design/motion'

type ChipSize = 'md' | 'lg'

const sizeClasses: Record<ChipSize, string> = {
  /** 36 px, 13 px – Filterleisten (Kategorien, Allergen-Filter). */
  md: 'h-9 px-3.5 text-label',
  /** 38 px, 14 px – in Formularen (Kategorie und Tags beim Anlegen). */
  lg: 'h-9.5 px-3.5 text-sm font-bold',
}

const chipBase =
  'touch-extend inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-pill transition-colors disabled:pointer-events-none disabled:opacity-35'

interface ChoiceChipProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  selected: boolean
  children: ReactNode
  size?: ChipSize
  /** Farbe im ausgewählten Zustand: dunkel (Standard) oder Akzent (Tags). */
  tone?: 'dark' | 'accent'
  /** Auf weißem Untergrund (z. B. im Sheet) mit Rahmen, damit sich der Chip abhebt. */
  outlined?: boolean
}

/** Auswahl-Chip zum An- und Abwählen (aria-pressed). */
export function ChoiceChip({
  selected,
  size = 'md',
  tone = 'dark',
  outlined = false,
  className = '',
  type = 'button',
  ...rest
}: ChoiceChipProps) {
  const selectedClasses = tone === 'accent' ? 'bg-accent text-on-accent border-accent' : 'bg-text text-surface border-text'
  const stateClasses = selected ? selectedClasses : 'bg-surface text-text border-border'
  return (
    <motion.button
      type={type}
      aria-pressed={selected}
      {...press}
      className={`${chipBase} ${sizeClasses[size]} ${outlined ? 'border-[1.5px] border-solid' : ''} ${stateClasses} ${className}`}
      {...rest}
    />
  )
}

interface AddChipProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: ReactNode
  size?: ChipSize
}

/** „+ Neue Kategorie“, „+ Tag“: gestrichelter Rahmen, gedämpfte Schrift. */
export function AddChip({ size = 'lg', className = '', type = 'button', children, ...rest }: AddChipProps) {
  return (
    <motion.button
      type={type}
      {...press}
      className={`${chipBase} ${sizeClasses[size]} border-[1.5px] border-dashed border-border-dashed bg-transparent text-text-muted ${className}`}
      {...rest}
    >
      + {children}
    </motion.button>
  )
}

interface AllergenChipProps {
  label: string
  /** „enthält“ (weiß gefüllt) oder „Spuren“ (gestrichelt, Präfix „Spuren:“). */
  kind: 'contains' | 'traces'
  /**
   * Springt beim Erscheinen kurz auf. Nur für Chips, die gerade neu dazukommen
   * (z. B. Zutat zum Mix hinzugefügt) – nicht bei jedem Screen-Aufbau.
   */
  appear?: boolean
}

/** Anzeige eines Allergens, nicht antippbar. */
export function AllergenChip({ label, kind, appear = false }: AllergenChipProps) {
  const kindClasses =
    kind === 'contains' ? 'bg-surface text-text' : 'border border-dashed border-border-dashed text-text-muted'
  return (
    <motion.span
      {...(appear ? chipIn() : {})}
      className={`inline-flex h-7.5 shrink-0 items-center rounded-pill px-3 text-label font-semibold ${kindClasses}`}
    >
      {kind === 'traces' ? `Spuren: ${label}` : label}
    </motion.span>
  )
}

interface ChipScrollerProps {
  children: ReactNode
  'aria-label'?: string
}

/** Horizontal scrollbare Chip-Leiste (z. B. Kategorien), ohne sichtbare Scrollleiste. */
export function ChipScroller({ children, ...rest }: ChipScrollerProps) {
  return (
    // Seitlich bis an den Bildschirmrand scrollen, Inhalt aber bündig mit dem Screen-Rand.
    <div role="group" className="chip-scroller -mx-screen flex gap-gap-sm px-screen py-1" {...rest}>
      {children}
    </div>
  )
}

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  'aria-label': string
}

/** Umschalter wie „Neueste | A–Z“: weiße Pille, aktives Segment dunkel. */
export function SegmentedControl<T extends string>({ options, value, onChange, ...rest }: SegmentedControlProps<T>) {
  return (
    <div role="radiogroup" className="inline-flex rounded-pill bg-surface p-1" {...rest}>
      {options.map((o) => {
        const active = o.value === value
        return (
          <motion.button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            {...press}
            onClick={() => onChange(o.value)}
            className={`touch-extend h-8 rounded-pill px-3 text-caption font-bold transition-colors ${active ? 'bg-text text-surface' : 'bg-transparent text-text'}`}
          >
            {o.label}
          </motion.button>
        )
      })}
    </div>
  )
}

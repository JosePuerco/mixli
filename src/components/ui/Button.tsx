// Buttons nach design/DESIGN.md („Buttons“): Pille, gibt beim Drücken nach (Skalierung .92).
// Größen aus den Prototypen: 56 (Haupt-Aktion unten), 52, 48, 44 und 36 px (kleine Pille, z. B. „Duplizieren“).
import { motion, type HTMLMotionProps } from 'motion/react'
import { press } from '../../design/motion'

export type ButtonVariant = 'primary' | 'surface' | 'muted' | 'dark'
export type ButtonSize = 'lg' | 'md' | 'sm' | 'xs' | 'compact'

const variantClasses: Record<ButtonVariant, string> = {
  /** Primär: Akzent, weiße Schrift. */
  primary: 'bg-accent text-on-accent active:bg-accent-hover',
  /** Sekundär auf grauem Grund: weiß. */
  surface: 'bg-surface text-text',
  /** Sekundär in weißen Karten und Sheets: grau. */
  muted: 'bg-surface-muted text-text',
  /** Dunkel, z. B. „Hinzufügen“ bei Kategorien. */
  dark: 'bg-text text-surface',
}

const sizeClasses: Record<ButtonSize, string> = {
  lg: 'h-14 px-6 text-body-large font-bold',
  md: 'h-13 px-5 text-body font-bold',
  sm: 'h-12 px-5 text-sm font-bold',
  xs: 'h-11 px-4 text-sm font-bold',
  // 36 px sichtbar, Tippfläche trotzdem 44 px (touch-extend).
  compact: 'touch-extend h-9 px-3 text-label',
}

export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'lg', fullWidth = false) {
  return [
    'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-pill transition-colors',
    'disabled:pointer-events-none disabled:opacity-35',
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? 'w-full' : '',
  ].join(' ')
}

export interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
}

export function Button({ variant, size, fullWidth, className = '', type = 'button', ...rest }: ButtonProps) {
  return (
    <motion.button
      type={type}
      {...press}
      className={`${buttonClasses(variant, size, fullWidth)} ${className}`}
      {...rest}
    />
  )
}

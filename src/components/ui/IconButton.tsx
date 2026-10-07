// Icon-Buttons: Kreis 44 px (z. B. Schließen, Zurück), und der FAB (60 px, Akzent, über der Navigation).
// aria-label ist Pflicht, weil kein sichtbarer Text da ist.
import { motion, type HTMLMotionProps } from 'motion/react'
import { press } from '../../design/motion'
import { IconPlus } from '../icons/Icons'

type IconButtonVariant = 'surface' | 'muted' | 'ghost'

const variantClasses: Record<IconButtonVariant, string> = {
  surface: 'bg-surface text-text',
  muted: 'bg-surface-muted text-text',
  /** Ohne Fläche, z. B. Löschen in Listen oder ± im Stepper. */
  ghost: 'bg-transparent text-text-muted',
}

interface IconButtonProps extends HTMLMotionProps<'button'> {
  'aria-label': string
  variant?: IconButtonVariant
}

export function IconButton({ variant = 'surface', className = '', type = 'button', ...rest }: IconButtonProps) {
  return (
    <motion.button
      type={type}
      {...press}
      className={`inline-flex size-touch shrink-0 items-center justify-center rounded-pill transition-colors disabled:pointer-events-none disabled:opacity-35 ${variantClasses[variant]} ${className}`}
      {...rest}
    />
  )
}

interface FabProps extends HTMLMotionProps<'button'> {
  'aria-label': string
}

/** Schwebender Aktions-Button rechts über der Navigation (Zutaten: „Neue Zutat“). */
export function Fab({ className = '', type = 'button', children, ...rest }: FabProps) {
  return (
    <motion.button
      type={type}
      {...press}
      className={`fab-position absolute z-10 inline-flex size-15 items-center justify-center rounded-pill bg-accent text-on-accent shadow-fab transition-colors active:bg-accent-hover ${className}`}
      {...rest}
    >
      {children ?? <IconPlus size={26} />}
    </motion.button>
  )
}

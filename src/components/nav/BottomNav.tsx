// Schwebende Navigation nach design/DESIGN.md:
// dunkle Pille (64 px, Radius 32), 16 px seitlich, 24 px unten plus Safe Area.
// Aktiver Tab: helle Pille mit Icon und Label, gleitet mit Feder zum neuen Tab.
// Inaktive Tabs: nur Icon in navIcon.
import { NavLink } from 'react-router'
import { motion } from 'motion/react'
import type { ComponentType } from 'react'
import { IconBowl, IconIngredients, IconList, IconMore, type IconProps } from '../icons/Icons'
import { press, softSpring } from '../../design/motion'

interface Tab {
  to: string
  label: string
  Icon: ComponentType<IconProps>
}

export const TABS: Tab[] = [
  { to: '/zutaten', label: 'Zutaten', Icon: IconIngredients },
  { to: '/mixen', label: 'Mixen', Icon: IconBowl },
  { to: '/muesli', label: 'Müslis', Icon: IconList },
  { to: '/mehr', label: 'Mehr', Icon: IconMore },
]

export function BottomNav() {
  return (
    <nav
      aria-label="Hauptnavigation"
      className="nav-position absolute inset-x-nav-inset-x grid h-nav grid-cols-4 gap-1 rounded-nav bg-nav p-1.5"
    >
      {TABS.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          aria-label={label}
          className="relative flex min-w-0 items-center justify-center rounded-pill focus-visible:outline-nav-icon"
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.span
                  layoutId="nav-active-pill"
                  className="absolute inset-0 rounded-pill bg-background"
                  transition={softSpring}
                />
              )}
              <motion.span
                {...press}
                className={`relative flex items-center gap-1.5 text-label ${isActive ? 'text-text' : 'text-nav-icon'}`}
              >
                {/* Größen und Strichstärken wie im Prototyp: aktiv 20/1,8, inaktiv 22/1,7 */}
                <Icon size={isActive ? 20 : 22} strokeWidth={isActive ? 1.8 : 1.7} />
                {/* Ohne eigenes Einblenden: Das dunkle Label wird sichtbar, sobald die helle Pille darunter gleitet. */}
                {isActive && <span>{label}</span>}
              </motion.span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

// Dünne Linien-Icons, übernommen aus design/prototypes/*.dc.html (keine Emojis).
import type { SVGProps } from 'react'

export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number
}

function Icon({ size = 22, strokeWidth = 1.7, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  )
}

export function IconIngredients(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </Icon>
  )
}

export function IconBowl(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 11h18a9 9 0 0 1-18 0z" />
      <path d="M8 7c1-2 3-2 4 0s3 2 4 0" />
    </Icon>
  )
}

export function IconList(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 6h13M8 12h13M8 18h13" />
      <circle cx="4" cy="6" r="1" />
      <circle cx="4" cy="12" r="1" />
      <circle cx="4" cy="18" r="1" />
    </Icon>
  )
}

export function IconMore(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="5" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
    </Icon>
  )
}

export function IconPlus(props: IconProps) {
  return (
    <Icon strokeWidth={2} {...props}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  )
}

export function IconClose(props: IconProps) {
  return (
    <Icon strokeWidth={1.8} {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Icon>
  )
}

export function IconBack(props: IconProps) {
  return (
    <Icon strokeWidth={1.8} {...props}>
      <path d="M15 5l-7 7 7 7" />
    </Icon>
  )
}

export function IconCheck(props: IconProps) {
  return (
    <Icon strokeWidth={2.2} {...props}>
      <path d="M5 12.5l4.5 4.5L19 7" />
    </Icon>
  )
}

export function IconCopy(props: IconProps) {
  return (
    <Icon strokeWidth={1.8} {...props}>
      <rect x="8" y="8" width="12" height="12" rx="3" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </Icon>
  )
}

export function IconTrash(props: IconProps) {
  return (
    <Icon strokeWidth={1.8} {...props}>
      <path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" />
    </Icon>
  )
}

export function IconCamera(props: IconProps) {
  return (
    <Icon strokeWidth={1.5} {...props}>
      <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
      <circle cx="12" cy="13" r="3.5" />
    </Icon>
  )
}

export function IconSearch(props: IconProps) {
  return (
    <Icon strokeWidth={1.8} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </Icon>
  )
}

export function IconLabel(props: IconProps) {
  return (
    <Icon strokeWidth={1.8} {...props}>
      <path d="M3 7l4-4h10l4 4v10l-4 4H7l-4-4z" />
      <path d="M8 10h8M8 14h5" />
    </Icon>
  )
}

import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.2, strokeLinecap: 'square' } as const

export const SearchIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...base} {...p}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M15.5 15.5 L21 21" />
  </svg>
)

export const BagIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...base} {...p}>
    <path d="M4.5 8 H19.5 V21 H4.5 Z" />
    <path d="M8.5 8 V6 a3.5 3.5 0 0 1 7 0 V8" />
  </svg>
)

export const CloseIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...base} {...p}>
    <path d="M5 5 L19 19 M19 5 L5 19" />
  </svg>
)

export const MenuIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" {...base} {...p}>
    <path d="M3 8 H21 M3 16 H21" />
  </svg>
)

export const InstagramIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...base} {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" />
  </svg>
)

export const PinterestIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...base} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M11 8.5 c3.5 -1 5.5 1.5 4.3 4 c-0.8 1.7 -3 2.2 -4 1 M11.6 10 L9.2 20" />
  </svg>
)

export const TiktokIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...base} {...p}>
    <path d="M13 4 V15.5 a3.5 3.5 0 1 1 -3.5 -3.5 M13 4 c0.5 2.5 2.3 4 5 4.2" />
  </svg>
)

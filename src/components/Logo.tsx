import { LOGO } from '@/lib/logoGeometry.js'

interface LogoProps {
  /** Color de relleno (por defecto hereda `currentColor`). */
  color?: string
  /** Altura de las mayúsculas (px o cualquier unidad CSS). */
  size?: number | string
  className?: string
  title?: string
}

/**
 * Logotipo KAEO dibujado a mano (ver lib/logoGeometry.js).
 * La A es una Λ sin barra, la O un círculo perfecto y la E tiene tres brazos iguales.
 */
export default function Logo({ color = 'currentColor', size = 24, className = '', title = 'KAEO' }: LogoProps) {
  // La caja del SVG incluye el pequeño rebase de la O; se escala para que `size` sea la altura de mayúscula.
  const scale = LOGO.height / 100
  const height = typeof size === 'number' ? `${size * scale}px` : `calc(${size} * ${scale})`
  return (
    <svg
      viewBox={`0 ${LOGO.top} ${LOGO.width} ${LOGO.height}`}
      style={{ height, width: 'auto' }}
      className={className}
      fill={color}
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <path d={LOGO.path} />
    </svg>
  )
}

/** La palabra KAEO dentro de un titular, a la altura de las mayúsculas del texto. */
export function KaeoWord({ className = '' }: { className?: string }) {
  return <Logo size="0.72em" className={`inline-block align-baseline ${className}`} />
}

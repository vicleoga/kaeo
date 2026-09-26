import 'server-only'
import { headers } from 'next/headers'

/**
 * IP del cliente. En producción la app está detrás de Caddy, que añade X-Forwarded-For;
 * el puerto de la app no se expone directamente a internet, así que la cabecera es fiable.
 */
export async function clientIp() {
  const h = await headers()
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'desconocida'
}

export async function userAgent() {
  return (await headers()).get('user-agent')?.slice(0, 300) ?? null
}

/**
 * Origen público de la web para construir URLs absolutas (vuelta del pago, emails).
 * En producción se usa NEXT_PUBLIC_SITE_URL (fiable); en desarrollo, el de la petición
 * (así funciona igual en localhost:3000, 3001…).
 */
export async function siteOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  if (process.env.NODE_ENV === 'production' && configured) return configured
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'http'
  return host ? `${proto}://${host}` : (configured ?? 'http://localhost:3000')
}

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

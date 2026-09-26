import 'server-only'
import { siteOrigin } from './request'

/**
 * URL para que la app se llame a sí misma (solo lo usan los proveedores simulados para
 * enviar sus webhooks). En producción: la dirección interna del contenedor (127.0.0.1:PORT),
 * sin pasar por internet. En desarrollo: el origen de la petición (sirve en cualquier puerto).
 */
export async function internalOrigin() {
  if (process.env.INTERNAL_URL) return process.env.INTERNAL_URL.replace(/\/$/, '')
  if (process.env.NODE_ENV === 'production') return `http://127.0.0.1:${process.env.PORT || 3000}`
  return siteOrigin()
}

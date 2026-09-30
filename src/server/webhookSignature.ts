import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'

// Firma de webhooks para los proveedores simulados, con el mismo esquema que Stripe:
//   cabecera  x-kaeo-signature: t=<unix>,v1=<hex(HMAC_SHA256(secret, `${t}.${body}`))>
// Se rechazan firmas incorrectas y mensajes de más de 5 minutos (evita reenvíos antiguos).
// Los proveedores reales usarán su propio mecanismo (p. ej. stripe.webhooks.constructEvent).

export const SIGNATURE_HEADER = 'x-kaeo-signature'
const TOLERANCE_SECONDS = 300

export function signPayload(body: string, secret: string, timestamp = Math.floor(Date.now() / 1000)) {
  const v1 = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')
  return `t=${timestamp},v1=${v1}`
}

export class WebhookSignatureError extends Error {}

export function verifySignature(body: string, header: string | null, secret: string) {
  if (!header) throw new WebhookSignatureError('Falta la firma')
  const parts = Object.fromEntries(header.split(',').map((p) => p.split('=') as [string, string]))
  const t = Number(parts.t)
  if (!parts.v1 || !Number.isFinite(t)) throw new WebhookSignatureError('Firma mal formada')
  if (Math.abs(Date.now() / 1000 - t) > TOLERANCE_SECONDS) throw new WebhookSignatureError('Firma caducada')
  const expected = createHmac('sha256', secret).update(`${t}.${body}`).digest()
  const given = Buffer.from(parts.v1, 'hex')
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) throw new WebhookSignatureError('Firma no válida')
}

/** Secreto de un proveedor. En producción es obligatorio; en desarrollo hay uno por defecto para los mocks. */
export function webhookSecret(envName: string) {
  const value = process.env[envName]
  if (value) return value
  if (process.env.NODE_ENV === 'production') throw new Error(`Falta la variable de entorno ${envName}`)
  return `dev-secret-${envName.toLowerCase()}`
}

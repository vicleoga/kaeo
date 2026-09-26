import 'server-only'
import { randomBytes } from 'node:crypto'
import { signPayload, SIGNATURE_HEADER, verifySignature, webhookSecret } from '@/server/webhookSignature'
import type { FulfillmentProvider, FulfillmentWebhookEvent } from './types'

/**
 * Producción simulada. Acepta todos los pedidos salvo:
 *  · FULFILLMENT_MOCK_FAIL=true, o
 *  · direcciones que contengan "FALLO PRODUCCION" (para probar el estado "requiere revisión").
 * Los avances (en producción, enviado, entregado) se simulan desde el panel del pedido en el admin,
 * que envía un webhook firmado a /api/webhooks/produccion.
 */
export const mockFulfillment: FulfillmentProvider = {
  name: 'mock',

  async submitOrder(order) {
    const text = `${order.address.line1} ${order.address.line2 ?? ''}`.toUpperCase()
    if (process.env.FULFILLMENT_MOCK_FAIL === 'true' || text.includes('FALLO PRODUCCION')) {
      throw new Error('El proveedor simulado ha rechazado el pedido (fallo forzado)')
    }
    return { providerRef: `mock_ful_${randomBytes(10).toString('hex')}` }
  },

  async getStatus() {
    return { status: 'SUBMITTED' }
  },

  async parseWebhook(rawBody, headers) {
    verifySignature(rawBody, headers.get(SIGNATURE_HEADER), webhookSecret('FULFILLMENT_WEBHOOK_SECRET'))
    const data = JSON.parse(rawBody) as FulfillmentWebhookEvent
    if (!data.eventId || !data.providerRef || !data.status) throw new Error('Webhook mock incompleto')
    return data
  },
}

/** Webhook firmado que enviaría el proveedor (lo usan los botones de simulación del admin). */
export function buildMockFulfillmentWebhook(providerRef: string, status: FulfillmentWebhookEvent['status']) {
  const event: FulfillmentWebhookEvent = {
    eventId: `evt_${randomBytes(12).toString('hex')}`,
    providerRef,
    status,
    ...(status === 'SHIPPED'
      ? {
          carrier: 'Correos Express (simulado)',
          trackingNumber: `KAEO${Math.floor(1e9 + Math.random() * 9e9)}`,
          trackingUrl: 'https://www.correosexpress.com/web/correosexpress/envios',
        }
      : {}),
    ...(status === 'FAILED' ? { message: 'Incidencia en producción (simulada)' } : {}),
  }
  const body = JSON.stringify(event)
  return { body, signature: signPayload(body, webhookSecret('FULFILLMENT_WEBHOOK_SECRET')) }
}

import 'server-only'
import { randomBytes } from 'node:crypto'
import { signPayload, SIGNATURE_HEADER, verifySignature, webhookSecret } from '@/server/webhookSignature'
import type { PaymentProvider, PaymentWebhookEvent } from './types'

/**
 * Pasarela simulada. La "página de pago" es /mock/pago/<ref>, con botones de pago correcto y fallido.
 * Al pulsarlos se envía un webhook firmado a /api/webhooks/pago, igual que haría Stripe:
 * así se prueba el mismo camino (firma, idempotencia, cambio de estado) que en producción.
 */
export const mockPayment: PaymentProvider = {
  name: 'mock',

  async createSession({ returnUrl }) {
    const providerRef = `mock_pay_${randomBytes(12).toString('hex')}`
    const url = new URL(`/mock/pago/${providerRef}`, returnUrl)
    url.searchParams.set('volver', returnUrl)
    return { providerRef, redirectUrl: url.pathname + url.search }
  },

  async refund() {
    return { refundRef: `mock_ref_${randomBytes(10).toString('hex')}` }
  },

  async parseWebhook(rawBody, headers) {
    verifySignature(rawBody, headers.get(SIGNATURE_HEADER), webhookSecret('PAYMENT_WEBHOOK_SECRET'))
    const data = JSON.parse(rawBody) as PaymentWebhookEvent
    if (!data.eventId || !data.providerRef) throw new Error('Webhook mock incompleto')
    return data
  },
}

/** Construye y firma el webhook que enviaría la pasarela (lo usa la página de pago simulada). */
export function buildMockPaymentWebhook(providerRef: string, outcome: 'succeeded' | 'failed', amountCents: number) {
  const event: PaymentWebhookEvent = {
    eventId: `evt_${randomBytes(12).toString('hex')}`,
    type: outcome === 'succeeded' ? 'payment.succeeded' : 'payment.failed',
    providerRef,
    amountCents,
    ...(outcome === 'failed' ? { failureReason: 'Tarjeta rechazada (simulado)' } : {}),
  }
  const body = JSON.stringify(event)
  return { body, signature: signPayload(body, webhookSecret('PAYMENT_WEBHOOK_SECRET')) }
}

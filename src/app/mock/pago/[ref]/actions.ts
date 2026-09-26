'use server'

import { redirect } from 'next/navigation'
import { prisma } from '@/server/db'
import { isMockPayment } from '@/server/providers/payment'
import { buildMockPaymentWebhook } from '@/server/providers/payment/mock'
import { SIGNATURE_HEADER } from '@/server/webhookSignature'
import { internalOrigin } from '@/server/internal'

/**
 * "Pulsar pagar" en la pasarela simulada: envía un webhook firmado a /api/webhooks/pago
 * por HTTP, exactamente como lo haría el proveedor real, y devuelve al cliente a la tienda.
 */
export async function simulatePayment(outcome: 'succeeded' | 'failed', formData: FormData) {
  if (!isMockPayment()) throw new Error('Pasarela simulada desactivada')
  const ref = String(formData.get('ref') ?? '')
  const back = String(formData.get('volver') ?? '/')

  const payment = await prisma.payment.findUnique({ where: { providerRef: ref } })
  if (!payment) throw new Error('Pago no encontrado')

  const { body, signature } = buildMockPaymentWebhook(ref, outcome, payment.amountCents)
  const res = await fetch(`${await internalOrigin()}/api/webhooks/pago`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', [SIGNATURE_HEADER]: signature },
    body,
  })
  if (!res.ok) console.error('mock pago: el webhook respondió', res.status, await res.text())

  // Solo se permite volver a rutas internas
  redirect(back.startsWith('/') && !back.startsWith('//') ? back : new URL(back).pathname + new URL(back).search)
}

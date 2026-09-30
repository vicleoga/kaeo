import { after } from 'next/server'
import { getPaymentProvider } from '@/server/providers/payment'
import { claimWebhookEvent, finishWebhookEvent } from '@/server/webhooks'
import { markPaid, markPaymentFailed, submitToProductionWithRetries } from '@/server/orders'

// Webhook del proveedor de pago.
//  1. Verifica la firma (si no es válida → 400 y no se toca nada).
//  2. Idempotencia: cada evento se procesa una sola vez (tabla WebhookEvent).
//  3. Aplica el cambio de estado; el envío a producción se hace DESPUÉS de responder (after),
//     para contestar rápido al proveedor, con reintentos.
export async function POST(req: Request) {
  const provider = getPaymentProvider()
  const raw = await req.text()

  let event
  try {
    event = await provider.parseWebhook(raw, req.headers)
  } catch (e) {
    console.warn('webhook pago rechazado:', e instanceof Error ? e.message : e)
    return Response.json({ error: 'firma no válida' }, { status: 400 })
  }

  const key = `payment:${provider.name}`
  if ((await claimWebhookEvent(key, event.eventId, event.type, event)) === 'duplicate') {
    return Response.json({ received: true, duplicate: true })
  }

  try {
    if (event.type === 'payment.succeeded') {
      const orderId = await markPaid(event.providerRef, event.amountCents, `webhook:${provider.name}`)
      after(() => submitToProductionWithRetries(orderId).catch((e) => console.error('producción tras pago', e)))
    } else if (event.type === 'payment.failed') {
      await markPaymentFailed(event.providerRef, event.failureReason, `webhook:${provider.name}`)
    }
    await finishWebhookEvent(key, event.eventId)
    return Response.json({ received: true })
  } catch (e) {
    console.error('webhook pago', e)
    await finishWebhookEvent(key, event.eventId, e)
    // 500 → el proveedor reintentará más tarde
    return Response.json({ error: 'error al procesar' }, { status: 500 })
  }
}

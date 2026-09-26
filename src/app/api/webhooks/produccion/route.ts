import { getFulfillmentProvider } from '@/server/providers/fulfillment'
import { claimWebhookEvent, finishWebhookEvent } from '@/server/webhooks'
import { applyFulfillmentEvent } from '@/server/orders'

// Webhook del proveedor de producción: estado del pedido y número de seguimiento.
// Misma estructura que el de pagos: firma → idempotencia → cambio de estado.
export async function POST(req: Request) {
  const provider = getFulfillmentProvider()
  const raw = await req.text()

  let event
  try {
    event = await provider.parseWebhook(raw, req.headers)
  } catch (e) {
    console.warn('webhook producción rechazado:', e instanceof Error ? e.message : e)
    return Response.json({ error: 'firma no válida' }, { status: 400 })
  }

  const key = `fulfillment:${provider.name}`
  if ((await claimWebhookEvent(key, event.eventId, event.status, event)) === 'duplicate') {
    return Response.json({ received: true, duplicate: true })
  }

  try {
    await applyFulfillmentEvent(event, `webhook:${provider.name}`)
    await finishWebhookEvent(key, event.eventId)
    return Response.json({ received: true })
  } catch (e) {
    console.error('webhook producción', e)
    await finishWebhookEvent(key, event.eventId, e)
    return Response.json({ error: 'error al procesar' }, { status: 500 })
  }
}

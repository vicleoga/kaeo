'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/server/db'
import { requireAdmin } from '@/server/auth'
import { addOrderNote, cancelOrder, markShippedManually, OrderError, refundOrder, submitToProduction, transition } from '@/server/orders'
import { notifyOrder } from '@/server/notifications'
import { isMockFulfillment } from '@/server/providers/fulfillment'
import { buildMockFulfillmentWebhook } from '@/server/providers/fulfillment/mock'
import { SIGNATURE_HEADER } from '@/server/webhookSignature'
import { internalOrigin } from '@/server/internal'
import { ORDER_STATUSES } from '@/lib/orderStatus'

export interface OrderActionState {
  ok?: string
  error?: string
}

const done = (orderId: string, ok: string): OrderActionState => {
  revalidatePath(`/admin/pedidos/${orderId}`)
  revalidatePath('/admin/pedidos')
  revalidatePath('/admin')
  return { ok }
}

async function run(orderId: string, ok: string, fn: (actor: string) => Promise<unknown>): Promise<OrderActionState> {
  const admin = await requireAdmin()
  try {
    await fn(`admin:${admin.login}`)
    return done(orderId, ok)
  } catch (e) {
    if (e instanceof OrderError) return { error: e.message }
    console.error('acción de pedido', e)
    return { error: e instanceof Error ? e.message : 'Error inesperado' }
  }
}

export async function changeStatus(orderId: string, _prev: OrderActionState, formData: FormData) {
  const to = z.enum(ORDER_STATUSES).safeParse(formData.get('status'))
  const note = String(formData.get('note') ?? '').trim().slice(0, 500) || undefined
  if (!to.success) return { error: 'Elige un estado.' }
  if (to.data === 'REFUNDED' || to.data === 'CANCELLED') return { error: 'Para cancelar o reembolsar usa sus botones (devuelven el dinero y el stock).' }
  return run(orderId, 'Estado actualizado.', async (actor) => {
    const changed = await prisma.$transaction((tx) => transition(tx, orderId, to.data, actor, note))
    // Cambios manuales que el cliente debe saber
    if (changed && to.data === 'SHIPPED') await notifyOrder(orderId, 'order.shipped')
    if (changed && to.data === 'DELIVERED') await notifyOrder(orderId, 'order.delivered')
  })
}

export async function refund(orderId: string, _prev: OrderActionState, formData: FormData) {
  const reason = String(formData.get('reason') ?? '').trim().slice(0, 500) || undefined
  return run(orderId, 'Pedido reembolsado.', (actor) => refundOrder(orderId, actor, reason))
}

export async function cancel(orderId: string, _prev: OrderActionState, formData: FormData) {
  const reason = String(formData.get('reason') ?? '').trim().slice(0, 500) || undefined
  return run(orderId, 'Pedido cancelado.', (actor) => cancelOrder(orderId, actor, reason))
}

export async function resendToProduction(orderId: string): Promise<OrderActionState> {
  const admin = await requireAdmin()
  const r = await submitToProduction(orderId, `admin:${admin.login}`)
  if (!r.ok) return { error: `No se ha podido enviar: ${r.error}` }
  return done(orderId, 'skipped' in r && r.skipped ? 'El pedido no tiene artículos bajo demanda.' : 'Enviado a producción.')
}

const shipSchema = z.object({
  carrier: z.string().trim().min(2, 'Indica la empresa de transporte').max(60),
  trackingNumber: z.string().trim().min(3, 'Indica el número de seguimiento').max(80),
  trackingUrl: z.union([z.literal(''), z.url('URL no válida').max(300)]),
})

export async function shipManually(orderId: string, _prev: OrderActionState, formData: FormData) {
  const parsed = shipSchema.safeParse({ carrier: formData.get('carrier'), trackingNumber: formData.get('trackingNumber'), trackingUrl: formData.get('trackingUrl') ?? '' })
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  return run(orderId, 'Marcado como enviado.', (actor) => markShippedManually(orderId, parsed.data, actor))
}

export async function addNote(orderId: string, _prev: OrderActionState, formData: FormData) {
  const note = String(formData.get('note') ?? '').trim().slice(0, 1000)
  if (!note) return { error: 'Escribe la nota.' }
  return run(orderId, 'Nota añadida.', (actor) => addOrderNote(orderId, actor.replace('admin:', ''), note))
}

/** Solo con el proveedor simulado: envía el webhook que mandaría el proveedor real. */
export async function simulateFulfillment(orderId: string, status: 'IN_PRODUCTION' | 'SHIPPED' | 'DELIVERED' | 'FAILED'): Promise<OrderActionState> {
  await requireAdmin()
  if (!isMockFulfillment()) return { error: 'Solo disponible con el proveedor de producción simulado.' }
  const job = await prisma.fulfillmentJob.findFirst({ where: { orderId, providerRef: { not: null }, provider: 'mock' }, orderBy: { createdAt: 'desc' } })
  if (!job?.providerRef) return { error: 'El pedido no se ha enviado aún al proveedor simulado.' }
  const { body, signature } = buildMockFulfillmentWebhook(job.providerRef, status)
  const res = await fetch(`${await internalOrigin()}/api/webhooks/produccion`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', [SIGNATURE_HEADER]: signature },
    body,
  })
  if (!res.ok) return { error: `El webhook ha respondido ${res.status}: ${await res.text()}` }
  return done(orderId, 'Webhook simulado enviado.')
}

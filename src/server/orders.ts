import 'server-only'
import { prisma } from './db'
import { canTransition, STATUS_LABEL, type OrderStatusValue } from '@/lib/orderStatus'
import { getPaymentProvider } from './providers/payment'
import { getFulfillmentProvider, type FulfillmentWebhookEvent, type ShippingAddress } from './providers/fulfillment'
import { notifyOrder } from './notifications'
import { getPaymentFees, paymentFeeFor } from './settings'
import type { Prisma } from '@/generated/prisma/client'

type Tx = Prisma.TransactionClient

export class OrderError extends Error {}

/**
 * Único punto por el que cambia el estado de un pedido: valida la transición,
 * guarda el historial y deja la fila bloqueada durante la transacción (SELECT … FOR UPDATE)
 * para que dos webhooks simultáneos no pisen el estado.
 */
export async function transition(tx: Tx, orderId: string, to: OrderStatusValue, actor: string, note?: string, extra: Prisma.OrderUpdateInput = {}) {
  const [row] = await tx.$queryRaw<{ status: OrderStatusValue }[]>`SELECT status FROM "Order" WHERE id = ${orderId} FOR UPDATE`
  if (!row) throw new OrderError('Pedido no encontrado')
  if (row.status === to) return false
  if (!canTransition(row.status, to)) throw new OrderError(`No se puede pasar de "${STATUS_LABEL[row.status]}" a "${STATUS_LABEL[to]}".`)
  await tx.order.update({ where: { id: orderId }, data: { ...extra, status: to } })
  await tx.orderStatusEvent.create({ data: { orderId, fromStatus: row.status, toStatus: to, actor, note } })
  return true
}

export async function addOrderNote(orderId: string, actor: string, note: string) {
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, select: { internalNotes: true } })
  const stamp = new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })
  await prisma.order.update({ where: { id: orderId }, data: { internalNotes: `${order.internalNotes}${order.internalNotes ? '\n' : ''}[${stamp} · ${actor}] ${note}` } })
}

// ───────────── Pago ─────────────

/** Pago confirmado (webhook). Descuenta stock propio, cuenta el uso del descuento y lanza la producción. */
export async function markPaid(paymentRef: string, amountCents: number | undefined, actor: string) {
  const payment = await prisma.payment.findUnique({ where: { providerRef: paymentRef }, include: { order: { include: { items: true } } } })
  if (!payment) throw new OrderError(`Pago desconocido: ${paymentRef}`)
  const order = payment.order
  if (payment.status === 'SUCCEEDED') return order.id // ya procesado

  let stockProblem: string | null = null
  // Comisión estimada de la pasarela (con Stripe real se podrá sustituir por la exacta del cobro)
  const paymentFeeCents = paymentFeeFor(amountCents ?? order.totalCents, await getPaymentFees())
  await prisma.$transaction(async (tx) => {
    await tx.payment.update({ where: { id: payment.id }, data: { status: 'SUCCEEDED', failureReason: null } })
    if (amountCents != null && amountCents !== order.totalCents) {
      stockProblem = `El importe cobrado (${amountCents}) no coincide con el total del pedido (${order.totalCents}).`
    }
    await transition(tx, order.id, 'PAID', actor, 'Pago confirmado', { paidAt: new Date(), paymentFeeCents })

    // Stock propio: se descuenta al pagar, de forma atómica (solo si hay suficiente).
    if (!order.stockCommitted) {
      for (const item of order.items.filter((i) => i.stockMode === 'OWN_STOCK' && i.variantId)) {
        const res = await tx.variant.updateMany({ where: { id: item.variantId!, stock: { gte: item.quantity } }, data: { stock: { decrement: item.quantity } } })
        if (res.count === 0) stockProblem = `Sin stock suficiente de ${item.sku} al confirmar el pago.`
      }
      await tx.order.update({ where: { id: order.id }, data: { stockCommitted: true } })
    }
    if (order.discountCode) await tx.discountCode.updateMany({ where: { code: order.discountCode }, data: { usedCount: { increment: 1 } } })
    if (stockProblem) await transition(tx, order.id, 'NEEDS_REVIEW', 'system', stockProblem)
  })

  await notifyOrder(order.id, 'order.confirmed')
  await notifyOrder(order.id, stockProblem ? 'admin.needs_review' : 'admin.new_order')
  return order.id
}

export async function markPaymentFailed(paymentRef: string, reason: string | undefined, actor: string) {
  const payment = await prisma.payment.findUnique({ where: { providerRef: paymentRef } })
  if (!payment) throw new OrderError(`Pago desconocido: ${paymentRef}`)
  if (payment.status !== 'PENDING') return payment.orderId
  await prisma.$transaction(async (tx) => {
    await tx.payment.update({ where: { id: payment.id }, data: { status: 'FAILED', failureReason: reason ?? null } })
    await transition(tx, payment.orderId, 'PAYMENT_FAILED', actor, reason)
  })
  return payment.orderId
}

// ───────────── Producción ─────────────

const MAX_FULFILLMENT_ATTEMPTS = 3

/**
 * Envía a producción las líneas bajo demanda. Si el pedido es solo de stock propio no hace nada
 * (se prepara y envía a mano desde el admin). Tras 3 fallos el pedido pasa a "requiere revisión".
 */
export async function submitToProduction(orderId: string, actor = 'system') {
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true, fulfillments: true } })
  const items = order.items.filter((i) => i.stockMode === 'ON_DEMAND')
  if (items.length === 0) {
    await addOrderNote(orderId, 'system', 'Pedido solo con stock propio: preparar y marcar como enviado desde el admin.')
    return { ok: true as const, skipped: true }
  }
  if (!['PAID', 'NEEDS_REVIEW'].includes(order.status)) return { ok: false as const, error: `El pedido está "${STATUS_LABEL[order.status]}".` }

  const provider = getFulfillmentProvider()
  let job = order.fulfillments.find((j) => j.status === 'PENDING' || j.status === 'FAILED')
  job ??= await prisma.fulfillmentJob.create({ data: { orderId, provider: provider.name } })

  try {
    const { providerRef } = await provider.submitOrder({
      orderNumber: order.number,
      email: order.email,
      address: order.shippingAddress as unknown as ShippingAddress,
      items: items.map((i) => ({ sku: i.sku, providerRef: i.providerRef, productName: i.productName, size: i.size, colorName: i.colorName, quantity: i.quantity })),
    })
    await prisma.$transaction(async (tx) => {
      await tx.fulfillmentJob.update({ where: { id: job.id }, data: { providerRef, status: 'SUBMITTED', attempts: { increment: 1 }, lastError: null } })
      await transition(tx, orderId, 'SENT_TO_PRODUCTION', actor, `Aceptado por ${provider.name} (${providerRef})`)
    })
    return { ok: true as const }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    const updated = await prisma.fulfillmentJob.update({ where: { id: job.id }, data: { status: 'FAILED', attempts: { increment: 1 }, lastError: message } })
    if (updated.attempts >= MAX_FULFILLMENT_ATTEMPTS && order.status !== 'NEEDS_REVIEW') {
      await prisma.$transaction((tx) => transition(tx, orderId, 'NEEDS_REVIEW', 'system', `El envío a producción ha fallado ${updated.attempts} veces: ${message}`))
      await notifyOrder(orderId, 'admin.needs_review')
    }
    return { ok: false as const, error: message, attempts: updated.attempts }
  }
}

/** Intentos automáticos con espera creciente (se ejecuta después de responder al webhook). */
export async function submitToProductionWithRetries(orderId: string) {
  for (let attempt = 1; attempt <= MAX_FULFILLMENT_ATTEMPTS; attempt++) {
    const r = await submitToProduction(orderId)
    if (r.ok || ('attempts' in r && (r.attempts ?? 0) >= MAX_FULFILLMENT_ATTEMPTS)) return r
    if (!('attempts' in r)) return r
    await new Promise((res) => setTimeout(res, attempt * 2000))
  }
}

const FULFILLMENT_TO_ORDER: Partial<Record<FulfillmentWebhookEvent['status'], OrderStatusValue>> = {
  IN_PRODUCTION: 'IN_PRODUCTION',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  FAILED: 'NEEDS_REVIEW',
}

export async function applyFulfillmentEvent(event: FulfillmentWebhookEvent, actor: string) {
  const job = await prisma.fulfillmentJob.findUnique({ where: { providerRef: event.providerRef } })
  if (!job) throw new OrderError(`Trabajo de producción desconocido: ${event.providerRef}`)
  const to = FULFILLMENT_TO_ORDER[event.status]
  let changed = false
  await prisma.$transaction(async (tx) => {
    await tx.fulfillmentJob.update({
      where: { id: job.id },
      data: {
        status: event.status,
        lastError: event.status === 'FAILED' ? (event.message ?? 'Fallo del proveedor') : job.lastError,
        ...(event.carrier ? { carrier: event.carrier } : {}),
        ...(event.trackingNumber ? { trackingNumber: event.trackingNumber } : {}),
        ...(event.trackingUrl ? { trackingUrl: event.trackingUrl } : {}),
      },
    })
    if (to) {
      const note = event.status === 'SHIPPED' ? `${event.carrier ?? ''} ${event.trackingNumber ?? ''}`.trim() : event.message
      changed = await transition(tx, job.orderId, to, actor, note || undefined)
    }
  })
  if (changed && to === 'SHIPPED') await notifyOrder(job.orderId, 'order.shipped')
  if (changed && to === 'NEEDS_REVIEW') await notifyOrder(job.orderId, 'admin.needs_review')
  return job.orderId
}

/** Envío manual (pedidos de stock propio o si el proveedor no informa). */
export async function markShippedManually(orderId: string, data: { carrier: string; trackingNumber: string; trackingUrl?: string }, actor: string) {
  await prisma.$transaction(async (tx) => {
    await tx.fulfillmentJob.create({
      data: { orderId, provider: 'manual', status: 'SHIPPED', carrier: data.carrier, trackingNumber: data.trackingNumber, trackingUrl: data.trackingUrl || null },
    })
    await transition(tx, orderId, 'SHIPPED', actor, `${data.carrier} ${data.trackingNumber}`)
  })
  await notifyOrder(orderId, 'order.shipped')
}

// ───────────── Reembolsos y cancelaciones ─────────────

const NOT_SHIPPED: OrderStatusValue[] = ['PAID', 'SENT_TO_PRODUCTION', 'IN_PRODUCTION', 'NEEDS_REVIEW']

async function restockIfNeeded(tx: Tx, orderId: string) {
  const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } })
  if (!order.stockCommitted) return
  for (const i of order.items.filter((x) => x.stockMode === 'OWN_STOCK' && x.variantId)) {
    await tx.variant.update({ where: { id: i.variantId! }, data: { stock: { increment: i.quantity } } })
  }
  await tx.order.update({ where: { id: orderId }, data: { stockCommitted: false } })
}

async function refundPayments(orderId: string, actor: string, reason?: string) {
  const provider = getPaymentProvider()
  const payments = await prisma.payment.findMany({ where: { orderId, status: { in: ['SUCCEEDED', 'PARTIALLY_REFUNDED'] } } })
  for (const p of payments) {
    const amount = p.amountCents - p.refundedCents
    if (amount <= 0) continue
    const { refundRef } = await provider.refund({ providerRef: p.providerRef, amountCents: amount, reason })
    await prisma.$transaction([
      prisma.refund.create({ data: { paymentId: p.id, providerRef: refundRef, amountCents: amount, reason, actor } }),
      prisma.payment.update({ where: { id: p.id }, data: { status: 'REFUNDED', refundedCents: p.amountCents } }),
    ])
  }
}

/** Reembolso completo. Si no se había enviado, devuelve el stock propio. */
export async function refundOrder(orderId: string, actor: string, reason?: string) {
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } })
  if (!canTransition(order.status, 'REFUNDED')) throw new OrderError(`No se puede reembolsar un pedido "${STATUS_LABEL[order.status]}".`)
  await refundPayments(orderId, actor, reason)
  await prisma.$transaction(async (tx) => {
    if (NOT_SHIPPED.includes(order.status)) await restockIfNeeded(tx, orderId)
    await transition(tx, orderId, 'REFUNDED', actor, reason)
  })
  await notifyOrder(orderId, 'order.refunded')
}

/** Cancela. Si ya estaba cobrado, primero reembolsa. */
export async function cancelOrder(orderId: string, actor: string, reason?: string) {
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } })
  if (!canTransition(order.status, 'CANCELLED')) throw new OrderError(`No se puede cancelar un pedido "${STATUS_LABEL[order.status]}".`)
  if (order.status !== 'PENDING_PAYMENT' && order.status !== 'PAYMENT_FAILED') await refundPayments(orderId, actor, reason)
  await prisma.$transaction(async (tx) => {
    await restockIfNeeded(tx, orderId)
    await transition(tx, orderId, 'CANCELLED', actor, reason)
  })
  await notifyOrder(orderId, 'order.cancelled')
}

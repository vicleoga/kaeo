import 'server-only'
import { prisma } from './db'
import { getCompany } from './settings'
import { getEmailProvider, type OutgoingEmail } from './providers/email'
import * as T from './emails/templates'

// Punto único de los emails de la tienda. Cada email se guarda en EmailLog (Admin → Emails),
// salga o no: con EMAIL_PROVIDER=log solo se registra. Un fallo de envío NUNCA rompe el
// pedido: se registra como FAILED y se puede reenviar desde el admin.

export type OrderNotification =
  | 'order.confirmed'
  | 'order.shipped'
  | 'order.delivered'
  | 'order.cancelled'
  | 'order.refunded'
  | 'admin.new_order'
  | 'admin.needs_review'

export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

/** Buzón que recibe los avisos internos: EMAIL_ADMIN, o el email de la empresa (Configuración). */
async function adminAddress() {
  return process.env.EMAIL_ADMIN || (await getCompany()).email || process.env.SMTP_USER || null
}

export async function sendEmail(kind: string, email: OutgoingEmail, orderId?: string) {
  let status: 'SENT' | 'FAILED' | 'LOGGED' = 'FAILED'
  let error: string | null = null
  let provider = process.env.EMAIL_PROVIDER || 'log'
  try {
    const p = getEmailProvider()
    provider = p.name
    await p.send(email)
    status = p.delivers ? 'SENT' : 'LOGGED'
  } catch (e) {
    error = (e instanceof Error ? e.message : String(e)).slice(0, 500)
    console.error(`[email] fallo al enviar "${email.subject}" a ${email.to}: ${error}`)
  }
  return prisma.emailLog.create({ data: { kind, ...email, replyTo: email.replyTo ?? null, status, provider, error, orderId: orderId ?? null } })
}

/** Reenvía un email ya registrado (mismo contenido y destinatario); queda como un registro nuevo. */
export async function resendEmail(id: string) {
  const log = await prisma.emailLog.findUniqueOrThrow({ where: { id } })
  return sendEmail(log.kind, { to: log.to, subject: log.subject, html: log.html, text: log.text, replyTo: log.replyTo ?? undefined }, log.orderId ?? undefined)
}

async function loadOrder(orderId: string) {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: {
      items: true,
      customer: true,
      fulfillments: { where: { trackingNumber: { not: null } }, orderBy: { updatedAt: 'desc' }, take: 1 },
      events: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  })
  const base = siteUrl()
  const tracking = order.fulfillments[0]
  const data: T.EmailOrder = {
    number: order.number,
    email: order.email,
    customerName: order.customer.name,
    url: `${base}/pedido/${order.number}?t=${order.accessToken}`,
    items: order.items,
    subtotalCents: order.subtotalCents,
    discountCents: order.discountCents,
    discountCode: order.discountCode,
    shippingCents: order.shippingCents,
    shippingName: order.shippingName,
    totalCents: order.totalCents,
    taxCents: order.taxCents,
    address: order.shippingAddress as unknown as T.EmailOrder['address'],
    // Solo enlaces http(s): la URL de seguimiento puede venir de un proveedor o escribirse a mano
    tracking: tracking ? { ...tracking, trackingUrl: tracking.trackingUrl && /^https?:\/\//i.test(tracking.trackingUrl) ? tracking.trackingUrl : null } : null,
    reason: order.events[0]?.note ?? null,
  }
  return { order, data, base }
}

export async function notifyOrder(orderId: string, kind: OrderNotification) {
  try {
    const { order, data, base } = await loadOrder(orderId)
    const toCustomer = (r: T.RenderedEmail) => sendEmail(kind, { to: order.email, ...r }, orderId)
    switch (kind) {
      case 'order.confirmed':
        return await toCustomer(T.orderConfirmed(data, base))
      case 'order.shipped':
        return await toCustomer(T.orderShipped(data, base))
      case 'order.delivered':
        return await toCustomer(T.orderDelivered(data, base))
      case 'order.refunded':
        return await toCustomer(T.orderRefunded(data, base, false))
      case 'order.cancelled':
        return await toCustomer(order.paidAt ? T.orderRefunded(data, base, true) : T.orderCancelledUnpaid(data, base))
      case 'admin.new_order':
      case 'admin.needs_review': {
        const to = await adminAddress()
        if (!to) return console.warn(`[email] ${kind} sin destinatario: configura EMAIL_ADMIN o el email de la empresa`)
        return await sendEmail(kind, { to, ...T.adminOrder(data, base, `${base}/admin/pedidos/${orderId}`, kind === 'admin.needs_review') }, orderId)
      }
    }
  } catch (e) {
    // Nunca romper el flujo del pedido por un email
    console.error(`[email] no se pudo preparar ${kind} del pedido ${orderId}:`, e)
  }
}

export async function notifyContact(m: { name: string; email: string; orderNumber: string | null; message: string }) {
  const to = await adminAddress()
  if (!to) return console.warn('[email] mensaje de contacto sin destinatario: configura EMAIL_ADMIN o el email de la empresa')
  const base = siteUrl()
  // Reply-To = el cliente: contestar al aviso le responde directamente a él
  return sendEmail('admin.contact', { to, replyTo: m.email, ...T.adminContact(m, base, `${base}/admin/mensajes`) })
}

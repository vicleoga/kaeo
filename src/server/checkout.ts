import 'server-only'
import { randomBytes } from 'node:crypto'
import { z } from 'zod'
import { prisma } from './db'
import { quoteOrder, type Quote } from './pricing'
import { cartInputSchema } from './cart'
import { getPaymentProvider } from './providers/payment'
import { orderNumber } from '@/lib/orderStatus'

export const checkoutSchema = z.object({
  checkoutKey: z.string().uuid(),
  items: cartInputSchema.min(1, 'Tu carrito está vacío'),
  email: z.email('Email no válido').trim().toLowerCase().max(200),
  name: z.string().trim().min(2, 'Escribe tu nombre y apellidos').max(120),
  phone: z
    .string()
    .trim()
    .max(30)
    .refine((v) => v === '' || /^[+\d][\d\s-]{6,}$/.test(v), 'Teléfono no válido'),
  line1: z.string().trim().min(3, 'Escribe la dirección').max(200),
  line2: z.string().trim().max(200),
  postalCode: z.string().trim().min(3, 'Código postal no válido').max(12),
  city: z.string().trim().min(2, 'Escribe la población').max(100),
  province: z.string().trim().min(2, 'Escribe la provincia').max(100),
  country: z.string().trim().length(2).toUpperCase(),
  note: z.string().trim().max(500),
  discountCode: z.string().trim().max(40),
  acceptTerms: z.literal(true, 'Debes aceptar las condiciones de venta'),
  newsletter: z.boolean(),
})

export type CheckoutInput = z.infer<typeof checkoutSchema>

export type PlaceOrderResult =
  | { ok: true; redirectUrl: string }
  | { ok: false; error: string; fields?: Record<string, string>; quote?: Quote }

/**
 * Crea el pedido (pendiente de pago) y la sesión de pago.
 * Idempotente por checkoutKey: si el cliente pulsa dos veces, se reutiliza el mismo pedido.
 */
export async function placeOrder(input: CheckoutInput, siteUrl: string): Promise<PlaceOrderResult> {
  const existing = await prisma.order.findUnique({ where: { checkoutKey: input.checkoutKey }, include: { payments: { orderBy: { createdAt: 'desc' }, take: 1 } } })
  if (existing) {
    if (existing.status !== 'PENDING_PAYMENT') return { ok: true, redirectUrl: `/pedido/${existing.number}?t=${existing.accessToken}` }
    return startPayment(existing.id, siteUrl)
  }

  const quote = await quoteOrder({ items: input.items, country: input.country, postalCode: input.postalCode, discountCode: input.discountCode })
  if (quote.problems.length) return { ok: false, error: quote.problems.join(' '), quote }
  if (quote.shippingError || !quote.shipping) return { ok: false, error: quote.shippingError ?? 'Revisa la dirección de envío.', fields: { postalCode: quote.shippingError ?? '' }, quote }
  if (input.discountCode && quote.discountError) return { ok: false, error: quote.discountError, fields: { discountCode: quote.discountError }, quote }
  if (quote.lines.length === 0) return { ok: false, error: 'Tu carrito está vacío.', quote }

  const address = {
    name: input.name,
    phone: input.phone || null,
    line1: input.line1,
    line2: input.line2 || null,
    postalCode: input.postalCode,
    city: input.city,
    province: input.province,
    country: input.country,
  }

  const order = await prisma.$transaction(async (tx) => {
    const customer = await tx.customer.upsert({
      where: { email: input.email },
      update: { name: input.name, phone: input.phone || undefined, ...(input.newsletter ? { marketingOptIn: true } : {}) },
      create: { email: input.email, name: input.name, phone: input.phone || null, marketingOptIn: input.newsletter },
    })
    const created = await tx.order.create({
      data: {
        number: `TMP-${input.checkoutKey}`,
        accessToken: randomBytes(24).toString('base64url'),
        checkoutKey: input.checkoutKey,
        customerId: customer.id,
        email: input.email,
        shippingAddress: address,
        shippingZone: quote.shipping!.zoneCode,
        shippingName: `${quote.shipping!.name}${quote.shipping!.estimatedDays ? ` · ${quote.shipping!.estimatedDays}` : ''}`,
        subtotalCents: quote.subtotalCents,
        discountCents: quote.discount?.amountCents ?? 0,
        discountCode: quote.discount?.code ?? null,
        shippingCents: quote.shipping!.priceCents,
        totalCents: quote.totalCents,
        taxCents: quote.taxCents,
        customerNote: input.note || null,
        items: {
          create: quote.lines.map((l) => ({
            variantId: l.variantId,
            productId: l.productId,
            productName: l.productName,
            sku: l.sku,
            size: l.size,
            colorName: l.colorName,
            image: l.image,
            unitPriceCents: l.unitPriceCents,
            quantity: l.quantity,
            vatRateBp: l.vatRateBp,
            totalCents: l.totalCents,
            stockMode: l.stockMode,
            providerRef: l.providerRef,
          })),
        },
        events: { create: { toStatus: 'PENDING_PAYMENT', actor: 'customer', note: 'Pedido creado en el checkout' } },
      },
    })
    return tx.order.update({ where: { id: created.id }, data: { number: orderNumber(created.seq, created.createdAt) } })
  })

  return startPayment(order.id, siteUrl)
}

/** Crea una sesión de pago nueva para un pedido pendiente (primer intento o reintento tras fallo). */
export async function startPayment(orderId: string, siteUrl: string): Promise<PlaceOrderResult> {
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } })
  if (!['PENDING_PAYMENT', 'PAYMENT_FAILED'].includes(order.status)) return { ok: false, error: 'Este pedido ya no está pendiente de pago.' }
  const provider = getPaymentProvider()
  const returnUrl = `${siteUrl}/pedido/${order.number}?t=${order.accessToken}`
  const session = await provider.createSession({
    orderId: order.id,
    orderNumber: order.number,
    amountCents: order.totalCents,
    currency: order.currency,
    email: order.email,
    returnUrl,
  })
  await prisma.payment.create({ data: { orderId: order.id, provider: provider.name, providerRef: session.providerRef, amountCents: order.totalCents } })
  return { ok: true, redirectUrl: session.redirectUrl }
}

'use server'

import { z } from 'zod'
import { prisma } from '@/server/db'
import { quoteOrder } from '@/server/pricing'
import { cartInputSchema } from '@/server/cart'
import { checkoutSchema, placeOrder, startPayment, type PlaceOrderResult } from '@/server/checkout'
import { consumeRateLimit } from '@/server/rateLimit'
import { clientIp, siteOrigin } from '@/server/request'
import { fieldErrors } from '@/lib/validation/product'

const quoteSchema = z.object({
  items: cartInputSchema,
  country: z.string().trim().max(2).optional(),
  postalCode: z.string().trim().max(12).optional(),
  discountCode: z.string().trim().max(40).optional(),
})

/** Resumen del pedido calculado en el servidor (se pide al cambiar dirección o código). */
export async function getQuote(input: unknown) {
  const parsed = quoteSchema.safeParse(input)
  if (!parsed.success) return null
  const limit = await consumeRateLimit(`quote:${await clientIp()}`, 300, 600)
  if (!limit.ok) return null
  return quoteOrder(parsed.data)
}

export async function submitOrder(input: unknown): Promise<PlaceOrderResult> {
  const limit = await consumeRateLimit(`checkout:${await clientIp()}`, 10, 600)
  if (!limit.ok) return { ok: false, error: 'Demasiados intentos seguidos. Espera unos minutos y vuelve a probar.' }

  const parsed = checkoutSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Revisa los campos marcados.', fields: fieldErrors(parsed.error) }
  try {
    return await placeOrder(parsed.data, await siteOrigin())
  } catch (e) {
    console.error('submitOrder', e)
    return { ok: false, error: 'No hemos podido crear el pedido. Inténtalo de nuevo en unos minutos.' }
  }
}

/** Nuevo intento de pago de un pedido cuyo pago falló (desde la página del pedido). */
export async function retryPayment(number: string, token: string): Promise<PlaceOrderResult> {
  const limit = await consumeRateLimit(`retry:${await clientIp()}`, 10, 600)
  if (!limit.ok) return { ok: false, error: 'Demasiados intentos. Espera unos minutos.' }
  const order = await prisma.order.findUnique({ where: { number } })
  if (!order || order.accessToken !== token) return { ok: false, error: 'Pedido no encontrado.' }
  return startPayment(order.id, await siteOrigin())
}

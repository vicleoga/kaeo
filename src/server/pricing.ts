import 'server-only'
import { prisma } from './db'
import { resolveZone } from './shipping'
import { getVatRateBp } from './settings'
import { variantAvailability } from '@/lib/stock'
import type { CartInput } from './cart'

// Cálculo de importes del pedido. SIEMPRE en el servidor: del navegador solo llegan
// variantes, cantidades, dirección y código de descuento.
// Todo en céntimos con IVA incluido; el IVA se desglosa (no se suma).

export interface PricedLine {
  variantId: string
  productId: string
  productName: string
  sku: string
  size: string
  colorName: string
  image: string | null
  unitPriceCents: number
  quantity: number
  vatRateBp: number
  stockMode: 'ON_DEMAND' | 'OWN_STOCK'
  providerRef: string | null
  /** Total de la línea tras repartir el descuento */
  totalCents: number
}

export interface Quote {
  lines: PricedLine[]
  /** Problemas que impiden comprar (sin stock, despublicado…) */
  problems: string[]
  subtotalCents: number
  discount: { code: string; amountCents: number; label: string } | null
  discountError: string | null
  shipping: { zoneCode: string; name: string; priceCents: number; free: boolean; estimatedDays: string } | null
  shippingError: string | null
  taxCents: number
  totalCents: number
}

/** Valida un código de descuento para un subtotal. Devuelve el importe o el motivo del rechazo. */
export async function evaluateDiscount(rawCode: string, subtotalCents: number) {
  const code = rawCode.trim().toUpperCase()
  const d = await prisma.discountCode.findUnique({ where: { code } })
  const now = new Date()
  if (!d || !d.active) return { ok: false as const, error: 'Este código no existe o no está activo.' }
  if (d.startsAt && d.startsAt > now) return { ok: false as const, error: 'Este código aún no está activo.' }
  if (d.expiresAt && d.expiresAt < now) return { ok: false as const, error: 'Este código ha caducado.' }
  if (d.maxUses != null && d.usedCount >= d.maxUses) return { ok: false as const, error: 'Este código ya se ha agotado.' }
  if (d.minSubtotalCents && subtotalCents < d.minSubtotalCents)
    return { ok: false as const, error: `Este código es para pedidos a partir de ${(d.minSubtotalCents / 100).toFixed(2).replace('.', ',')} €.` }
  const amountCents =
    d.type === 'PERCENT' ? Math.floor((subtotalCents * d.value) / 10000) : Math.min(d.value, subtotalCents)
  const label = d.type === 'PERCENT' ? `${(d.value / 100).toLocaleString('es-ES')} %` : `${(d.value / 100).toFixed(2).replace('.', ',')} €`
  return { ok: true as const, code: d.code, amountCents, label }
}

/** Reparte un descuento entre líneas proporcionalmente (el redondeo sobrante va a las primeras). */
function allocate(totals: number[], discount: number) {
  const sum = totals.reduce((a, b) => a + b, 0)
  if (!sum || !discount) return totals.map(() => 0)
  const raw = totals.map((t) => (t * discount) / sum)
  const parts = raw.map(Math.floor)
  let rest = discount - parts.reduce((a, b) => a + b, 0)
  const order = raw.map((r, i) => [r - Math.floor(r), i] as const).sort((a, b) => b[0] - a[0])
  for (const [, i] of order) {
    if (rest <= 0) break
    parts[i]++
    rest--
  }
  return parts
}

/** IVA contenido en un importe con IVA incluido */
const includedTax = (grossCents: number, rateBp: number) => Math.round((grossCents * rateBp) / (10000 + rateBp))

export async function quoteOrder(input: {
  items: CartInput
  country?: string
  postalCode?: string
  discountCode?: string
}): Promise<Quote> {
  const defaultVat = await getVatRateBp()
  const qtyById = new Map<string, number>()
  for (const l of input.items) qtyById.set(l.variantId, (qtyById.get(l.variantId) ?? 0) + l.qty)

  const variants = await prisma.variant.findMany({
    where: { id: { in: [...qtyById.keys()] } },
    include: { color: true, product: { include: { images: { orderBy: { sortOrder: 'asc' } } } } },
  })

  const problems: string[] = []
  const lines: PricedLine[] = []
  for (const v of variants) {
    const p = v.product
    const qty = qtyById.get(v.id)!
    const { available, maxQty } = variantAvailability(p.stockMode, v)
    const label = `${p.name} (${v.color.name}, ${v.size})`
    if (!available || p.status !== 'PUBLISHED') {
      problems.push(`${label} ya no está disponible.`)
      continue
    }
    if (qty > maxQty) problems.push(`Solo quedan ${maxQty} de ${label}.`)
    const unit = v.priceCents ?? p.priceCents
    const image = p.images.find((i) => i.colorId === v.colorId) ?? p.images[0]
    lines.push({
      variantId: v.id,
      productId: p.id,
      productName: p.name,
      sku: v.sku,
      size: v.size,
      colorName: v.color.name,
      image: image ? (image.thumbUrl ?? image.url) : null,
      unitPriceCents: unit,
      quantity: qty,
      vatRateBp: p.vatRateBp ?? defaultVat,
      stockMode: p.stockMode,
      providerRef: v.providerRef ?? p.providerRef,
      totalCents: unit * qty,
    })
  }
  if (variants.length < qtyById.size) problems.push('Algún artículo del carrito ya no existe.')

  const subtotalCents = lines.reduce((n, l) => n + l.totalCents, 0)

  // Descuento
  let discount: Quote['discount'] = null
  let discountError: string | null = null
  if (input.discountCode?.trim()) {
    const r = await evaluateDiscount(input.discountCode, subtotalCents)
    if (r.ok) discount = { code: r.code, amountCents: r.amountCents, label: r.label }
    else discountError = r.error
  }
  const discountCents = discount?.amountCents ?? 0
  allocate(lines.map((l) => l.totalCents), discountCents).forEach((d, i) => (lines[i].totalCents -= d))

  // Envío
  let shipping: Quote['shipping'] = null
  let shippingError: string | null = null
  if (input.country && input.postalCode) {
    const r = await resolveZone(input.country, input.postalCode)
    if (r.ok) {
      const free = r.zone.freeFromCents != null && subtotalCents - discountCents >= r.zone.freeFromCents
      shipping = { zoneCode: r.zone.code, name: r.zone.name, priceCents: free ? 0 : r.zone.priceCents, free, estimatedDays: r.zone.estimatedDays }
    } else shippingError = r.error
  }
  const shippingCents = shipping?.priceCents ?? 0

  const taxCents = lines.reduce((n, l) => n + includedTax(l.totalCents, l.vatRateBp), 0) + includedTax(shippingCents, defaultVat)

  return {
    lines,
    problems,
    subtotalCents,
    discount,
    discountError,
    shipping,
    shippingError,
    taxCents,
    totalCents: subtotalCents - discountCents + shippingCents,
  }
}

import 'server-only'
import { z } from 'zod'
import { prisma } from './db'
import { variantAvailability } from '@/lib/stock'
import type { CartLine } from '@/lib/types'

/** Lo único que se acepta del navegador: qué variante y cuántas unidades. */
export const cartInputSchema = z
  .array(z.object({ variantId: z.string().min(1).max(40), qty: z.number().int().min(1).max(99) }))
  .max(50)

export type CartInput = z.infer<typeof cartInputSchema>

/**
 * Reconstruye el carrito con los datos actuales de la BD (nombre, precio, foto, stock).
 * El navegador guarda una copia para pintar rápido, pero la fuente de verdad es esta:
 * precios y disponibilidad SIEMPRE se calculan en el servidor.
 * Las variantes que ya no existen o no están a la venta vuelven marcadas como `unavailable`.
 */
export async function refreshCartLines(input: CartInput): Promise<CartLine[]> {
  // Agrupa líneas repetidas de la misma variante
  const qtyById = new Map<string, number>()
  for (const l of input) qtyById.set(l.variantId, (qtyById.get(l.variantId) ?? 0) + l.qty)

  const variants = await prisma.variant.findMany({
    where: { id: { in: [...qtyById.keys()] } },
    include: {
      color: true,
      product: { include: { images: { orderBy: { sortOrder: 'asc' }, include: { color: true } } } },
    },
  })
  const byId = new Map(variants.map((v) => [v.id, v]))

  const lines: CartLine[] = []
  for (const [variantId, requested] of qtyById) {
    const v = byId.get(variantId)
    if (!v) continue // la variante ya no existe: se descarta sin más
    const p = v.product
    const { available, maxQty } = variantAvailability(p.stockMode, v)
    const sellable = available && p.status === 'PUBLISHED'
    const image = p.images.find((i) => i.color?.id === v.colorId) ?? p.images[0]
    lines.push({
      variantId,
      productId: p.id,
      slug: p.slug,
      name: p.name,
      sku: v.sku,
      size: v.size,
      color: { key: v.color.key, name: v.color.name, hex: v.color.hex },
      priceCents: v.priceCents ?? p.priceCents,
      image: image ? (image.thumbUrl ?? image.url) : '/images/moodboard/kaeo-moodboard.webp',
      qty: sellable ? Math.min(requested, maxQty) : requested,
      maxQty: sellable ? maxQty : 0,
      ...(sellable ? {} : { unavailable: true }),
    })
  }
  return lines
}

import 'server-only'
import { prisma } from './db'
import { productCode, skuFor } from '@/lib/catalog'
import type { Prisma } from '@/generated/prisma/client'

type Tx = Prisma.TransactionClient

/** Siguiente código correlativo libre (KA0017). */
export async function nextProductCode(tx: Tx = prisma) {
  const last = await tx.product.findFirst({ orderBy: { code: 'desc' }, select: { code: true } })
  const n = last ? parseInt(last.code.replace(/\D/g, ''), 10) || 0 : 0
  return productCode(n + 1)
}

/**
 * Deja las variantes del producto alineadas con sus tallas × colores:
 *  · crea las combinaciones nuevas (con SKU automático),
 *  · reactiva las que vuelven a existir,
 *  · desactiva las que ya no existen (no se borran: en la fase 4 los pedidos las referencian).
 */
export async function syncVariants(tx: Tx, productId: string, sizes: string[], colorIds: string[]) {
  const product = await tx.product.findUniqueOrThrow({ where: { id: productId }, select: { code: true } })
  const colors = await tx.color.findMany({ where: { id: { in: colorIds } } })
  const existing = await tx.variant.findMany({ where: { productId } })
  const key = (size: string, colorId: string) => `${size}::${colorId}`
  const wanted = new Set(colors.flatMap((c) => sizes.map((s) => key(s, c.id))))

  for (const c of colors) {
    for (const size of sizes) {
      const found = existing.find((v) => v.size === size && v.colorId === c.id)
      if (found) {
        if (!found.active) await tx.variant.update({ where: { id: found.id }, data: { active: true } })
        continue
      }
      let sku = skuFor(product.code, c.code, size)
      // Dos tallas pueden dar el mismo SKU al limpiar caracteres ("S/M" y "SM"): se desambigua.
      for (let i = 2; await tx.variant.findUnique({ where: { sku } }); i++) sku = `${skuFor(product.code, c.code, size)}-${i}`
      await tx.variant.create({ data: { productId, size, colorId: c.id, sku } })
    }
  }

  const obsolete = existing.filter((v) => v.active && !wanted.has(key(v.size, v.colorId))).map((v) => v.id)
  if (obsolete.length) await tx.variant.updateMany({ where: { id: { in: obsolete } }, data: { active: false } })
}

/** Variantes de stock propio en o por debajo de su umbral de aviso. */
export async function lowStockVariants(limit = 50) {
  const variants = await prisma.variant.findMany({
    where: { active: true, product: { stockMode: 'OWN_STOCK' } },
    include: { product: { select: { id: true, name: true, status: true } }, color: true },
    orderBy: [{ stock: 'asc' }, { sku: 'asc' }],
  })
  return variants.filter((v) => v.stock <= v.lowStockThreshold).slice(0, limit)
}

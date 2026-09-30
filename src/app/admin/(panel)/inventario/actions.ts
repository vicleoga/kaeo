'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/server/db'
import { requireAdmin } from '@/server/auth'

export interface InventoryState {
  ok?: string
  error?: string
}

/** Guarda el stock de las variantes enviadas (campos stock.<variantId>). Solo toca las que cambian. */
export async function saveStock(_prev: InventoryState, formData: FormData): Promise<InventoryState> {
  await requireAdmin()
  const entries = [...formData.entries()].filter(([k]) => k.startsWith('stock.'))
  const changes: { id: string; stock: number }[] = []
  for (const [key, value] of entries) {
    const id = key.slice('stock.'.length)
    const stock = Number(String(value).trim())
    if (!Number.isInteger(stock) || stock < 0 || stock > 1_000_000) return { error: 'Hay cantidades no válidas (números enteros ≥ 0).' }
    if (String(formData.get(`orig.${id}`)) !== String(stock)) changes.push({ id, stock })
  }
  if (changes.length === 0) return { ok: 'No había cambios.' }

  // Solo variantes de productos con stock propio
  const allowed = await prisma.variant.findMany({
    where: { id: { in: changes.map((c) => c.id) }, product: { stockMode: 'OWN_STOCK' } },
    select: { id: true },
  })
  const ok = new Set(allowed.map((v) => v.id))
  await prisma.$transaction(changes.filter((c) => ok.has(c.id)).map((c) => prisma.variant.update({ where: { id: c.id }, data: { stock: c.stock } })))

  revalidatePath('/admin', 'layout')
  return { ok: `Stock actualizado en ${ok.size} variante${ok.size === 1 ? '' : 's'}.` }
}

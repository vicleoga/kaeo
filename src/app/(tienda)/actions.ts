'use server'

import { cartInputSchema, refreshCartLines } from '@/server/cart'
import type { CartLine } from '@/lib/types'

/** Revalida el carrito guardado en el navegador contra la base de datos. */
export async function refreshCart(input: unknown): Promise<CartLine[]> {
  const parsed = cartInputSchema.safeParse(input)
  if (!parsed.success) return []
  return refreshCartLines(parsed.data)
}

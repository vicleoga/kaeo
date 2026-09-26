import 'server-only'
import { prisma } from './db'

/** Umbral de envío gratis de la península (orientativo para el carrito; el checkout calcula el real). */
export async function freeShippingThreshold() {
  const zone = await prisma.shippingZone.findUnique({ where: { code: 'PENINSULA' }, select: { active: true, freeFromCents: true } })
  return zone?.active ? zone.freeFromCents : null
}

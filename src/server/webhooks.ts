import 'server-only'
import { prisma } from './db'
import { Prisma } from '@/generated/prisma/client'

/**
 * Registra un webhook para procesarlo UNA sola vez (índice único proveedor + id de evento).
 * Devuelve 'new' si hay que procesarlo, 'duplicate' si ya se procesó.
 * Si llegó antes pero falló al procesarse, se permite reintentar (los proveedores reenvían).
 */
export async function claimWebhookEvent(provider: string, eventId: string, type: string, payload: unknown): Promise<'new' | 'duplicate'> {
  try {
    await prisma.webhookEvent.create({ data: { provider, eventId, type, payload: payload as object } })
    return 'new'
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      const prev = await prisma.webhookEvent.findUnique({ where: { provider_eventId: { provider, eventId } } })
      return prev?.processedAt ? 'duplicate' : 'new'
    }
    throw e
  }
}

export async function finishWebhookEvent(provider: string, eventId: string, error?: unknown) {
  await prisma.webhookEvent.update({
    where: { provider_eventId: { provider, eventId } },
    data: error ? { error: error instanceof Error ? error.message : String(error) } : { processedAt: new Date(), error: null },
  })
}

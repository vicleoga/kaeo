'use server'

import { redirect } from 'next/navigation'
import { prisma } from '@/server/db'
import { consumeRateLimit } from '@/server/rateLimit'
import { clientIp } from '@/server/request'

export interface TrackState {
  error?: string
  number?: string
  email?: string
}

export async function trackOrder(_prev: TrackState, formData: FormData): Promise<TrackState> {
  const number = String(formData.get('number') ?? '').trim().toUpperCase().slice(0, 40)
  const email = String(formData.get('email') ?? '').trim().toLowerCase().slice(0, 200)
  if (!number || !email) return { error: 'Escribe el número de pedido y el email.', number, email }

  // Límite para que no se puedan probar números de pedido a ciegas
  const limit = await consumeRateLimit(`track:${await clientIp()}`, 10, 600)
  if (!limit.ok) return { error: 'Demasiadas consultas seguidas. Vuelve a probar en unos minutos.', number, email }

  const order = await prisma.order.findUnique({ where: { number }, select: { email: true, accessToken: true, number: true } })
  // Mismo mensaje exista o no el pedido (no se revela qué números existen)
  if (!order || order.email !== email) return { error: 'No encontramos ningún pedido con esos datos. Revisa el número y el email.', number, email }
  redirect(`/pedido/${order.number}?t=${order.accessToken}`)
}

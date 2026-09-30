'use server'

import { z } from 'zod'
import { prisma } from '@/server/db'
import { consumeRateLimit } from '@/server/rateLimit'
import { clientIp } from '@/server/request'
import { notifyContact } from '@/server/notifications'

export interface ContactState {
  ok?: boolean
  error?: string
  fields?: Record<string, string>
  values?: Record<string, string>
}

const schema = z.object({
  name: z.string().trim().min(2, 'Escribe tu nombre').max(100),
  email: z.email('Email no válido').max(200),
  orderNumber: z.string().trim().toUpperCase().max(40),
  message: z.string().trim().min(10, 'Cuéntanos un poco más (mínimo 10 caracteres)').max(4000, 'El mensaje es demasiado largo (máximo 4000 caracteres)'),
  acceptPrivacy: z.literal('on', 'Necesitamos que aceptes la política de privacidad para poder responderte'),
})

export async function sendContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const raw = Object.fromEntries(['name', 'email', 'orderNumber', 'message', 'acceptPrivacy'].map((k) => [k, String(formData.get(k) ?? '')]))
  const values = { name: raw.name, email: raw.email, orderNumber: raw.orderNumber, message: raw.message }

  // Trampa para bots: campo invisible que una persona nunca rellena. Se responde "ok" sin guardar nada.
  if (String(formData.get('website') ?? '')) return { ok: true }

  const parsed = schema.safeParse({ ...raw, email: raw.email.trim().toLowerCase() })
  if (!parsed.success) {
    const fields: Record<string, string> = {}
    for (const issue of parsed.error.issues) fields[String(issue.path[0])] ??= issue.message
    return { error: 'Revisa los campos marcados.', fields, values }
  }

  const ip = await clientIp()
  const limit = await consumeRateLimit(`contact:${ip}`, 5, 3600)
  if (!limit.ok) return { error: 'Has enviado varios mensajes seguidos. Vuelve a intentarlo dentro de un rato o escríbenos directamente por email.', values }

  const { name, email, orderNumber, message } = parsed.data
  await prisma.contactMessage.create({ data: { name, email, orderNumber: orderNumber || null, message, ip } })
  await notifyContact({ name, email, orderNumber: orderNumber || null, message })
  return { ok: true }
}

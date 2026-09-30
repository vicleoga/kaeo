'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { prisma } from '@/server/db'
import { requireAdmin } from '@/server/auth'
import { parseEuros } from '@/lib/catalog'
import { fromMadridLocal } from '@/lib/dates'
import { fieldErrors } from '@/lib/validation/product'

export interface DiscountFormState {
  ok?: string
  error?: string
  fields?: Record<string, string>
}

const optionalDate = z.string().transform((v, ctx) => {
  if (!v) return null
  const d = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v) ? fromMadridLocal(v) : new Date(NaN)
  if (Number.isNaN(d.getTime())) {
    ctx.addIssue({ code: 'custom', message: 'Fecha no válida' })
    return z.NEVER
  }
  return d
})

const schema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9_-]{3,30}$/, 'De 3 a 30 caracteres: letras, números, guion o guion bajo'),
    type: z.enum(['PERCENT', 'AMOUNT']),
    value: z.string(),
    minSubtotal: z.string(),
    startsAt: optionalDate,
    expiresAt: optionalDate,
    maxUses: z.string().transform((v, ctx) => {
      if (!v.trim()) return null
      const n = Number(v)
      if (!Number.isInteger(n) || n < 1) {
        ctx.addIssue({ code: 'custom', message: 'Número entero mayor que 0' })
        return z.NEVER
      }
      return n
    }),
    active: z.boolean(),
    description: z.string().trim().max(200),
  })
  .transform((d, ctx) => {
    let value: number | null
    if (d.type === 'PERCENT') {
      const n = Number(d.value.replace(',', '.').replace('%', ''))
      value = Number.isFinite(n) && n > 0 && n <= 100 ? Math.round(n * 100) : null
      if (value == null) ctx.addIssue({ code: 'custom', path: ['value'], message: 'Porcentaje entre 0 y 100' })
    } else {
      value = parseEuros(d.value)
      if (!value) ctx.addIssue({ code: 'custom', path: ['value'], message: 'Importe no válido' })
    }
    const minSubtotalCents = d.minSubtotal.trim() ? parseEuros(d.minSubtotal) : null
    if (d.minSubtotal.trim() && minSubtotalCents == null) ctx.addIssue({ code: 'custom', path: ['minSubtotal'], message: 'Importe no válido' })
    if (d.startsAt && d.expiresAt && d.expiresAt <= d.startsAt) ctx.addIssue({ code: 'custom', path: ['expiresAt'], message: 'Debe ser posterior al inicio' })
    return { code: d.code, type: d.type, value: value ?? 0, minSubtotalCents, startsAt: d.startsAt, expiresAt: d.expiresAt, maxUses: d.maxUses, active: d.active, description: d.description }
  })

export async function saveDiscount(id: string | null, _prev: DiscountFormState, formData: FormData): Promise<DiscountFormState> {
  await requireAdmin()
  const parsed = schema.safeParse({
    code: formData.get('code') ?? '',
    type: formData.get('type') ?? '',
    value: formData.get('value') ?? '',
    minSubtotal: formData.get('minSubtotal') ?? '',
    startsAt: formData.get('startsAt') ?? '',
    expiresAt: formData.get('expiresAt') ?? '',
    maxUses: formData.get('maxUses') ?? '',
    active: formData.get('active') === 'on',
    description: formData.get('description') ?? '',
  })
  if (!parsed.success) return { error: 'Revisa los campos marcados.', fields: fieldErrors(parsed.error) }
  const clash = await prisma.discountCode.findFirst({ where: { code: parsed.data.code, NOT: id ? { id } : undefined } })
  if (clash) return { error: 'Revisa los campos marcados.', fields: { code: 'Ya existe un código igual' } }

  if (id) await prisma.discountCode.update({ where: { id }, data: parsed.data })
  else await prisma.discountCode.create({ data: parsed.data })
  revalidatePath('/admin/descuentos')
  if (!id) redirect('/admin/descuentos?creado=1')
  return { ok: 'Código guardado.' }
}

export async function deleteDiscount(id: string) {
  await requireAdmin()
  const d = await prisma.discountCode.findUniqueOrThrow({ where: { id } })
  // Los códigos ya usados no se borran (los pedidos guardan el código): se desactivan.
  if (d.usedCount > 0) await prisma.discountCode.update({ where: { id }, data: { active: false } })
  else await prisma.discountCode.delete({ where: { id } })
  revalidatePath('/admin/descuentos')
  redirect('/admin/descuentos')
}

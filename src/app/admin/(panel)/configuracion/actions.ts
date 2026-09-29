'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/server/db'
import { requireAdmin } from '@/server/auth'
import { setSetting } from '@/server/settings'
import { parseEuros } from '@/lib/catalog'
import { fieldErrors } from '@/lib/validation/product'

export interface SettingsState {
  ok?: string
  error?: string
  fields?: Record<string, string>
}

const refreshAll = () => {
  revalidatePath('/', 'layout')
  revalidatePath('/admin', 'layout')
}

/** Zonas de envío: campos zone.<id>.active / price / freeFrom / days */
export async function saveShippingZones(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  await requireAdmin()
  const zones = await prisma.shippingZone.findMany()
  const errors: Record<string, string> = {}
  const updates: { id: string; data: { active: boolean; priceCents: number; costCents: number; freeFromCents: number | null; estimatedDays: string } }[] = []

  for (const z of zones) {
    const f = (k: string) => String(formData.get(`zone.${z.id}.${k}`) ?? '').trim()
    if (!formData.has(`zone.${z.id}.price`)) continue
    const price = parseEuros(f('price'))
    const freeText = f('freeFrom')
    const freeFrom = freeText ? parseEuros(freeText) : null
    const costText = f('cost')
    const cost = costText ? parseEuros(costText) : 0
    if (price == null || price < 0) errors[z.id] = `${z.name}: precio de envío no válido`
    else if (freeText && freeFrom == null) errors[z.id] = `${z.name}: importe de envío gratis no válido`
    else if (cost == null) errors[z.id] = `${z.name}: coste de envío no válido`
    updates.push({
      id: z.id,
      data: { active: formData.get(`zone.${z.id}.active`) === 'on', priceCents: price ?? 0, costCents: cost ?? 0, freeFromCents: freeFrom, estimatedDays: f('days').slice(0, 60) },
    })
  }
  if (Object.keys(errors).length) return { error: Object.values(errors).join(' · '), fields: errors }
  if (!updates.some((u) => u.data.active)) return { error: 'Debe haber al menos una zona activa, o nadie podrá comprar.' }

  await prisma.$transaction(updates.map((u) => prisma.shippingZone.update({ where: { id: u.id }, data: u.data })))
  refreshAll()
  return { ok: 'Zonas de envío guardadas.' }
}

export async function saveVat(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  await requireAdmin()
  const raw = String(formData.get('vat') ?? '').trim().replace(',', '.').replace('%', '')
  const n = Number(raw)
  if (!raw || !Number.isFinite(n) || n < 0 || n > 30) return { error: 'IVA no válido (entre 0 y 30 %).', fields: { vat: 'IVA no válido' } }
  await setSetting('vatRateBp', Math.round(n * 100))
  refreshAll()
  return { ok: 'IVA general guardado. Se aplica a los pedidos nuevos (los ya hechos conservan el suyo).' }
}

export async function savePaymentFees(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  await requireAdmin()
  const pct = Number(String(formData.get('percent') ?? '').trim().replace(',', '.').replace('%', ''))
  const fixed = parseEuros(String(formData.get('fixed') ?? '').trim() || '0')
  if (!Number.isFinite(pct) || pct < 0 || pct > 10) return { error: 'Porcentaje no válido (entre 0 y 10 %).' }
  if (fixed == null || fixed > 500) return { error: 'Importe fijo no válido.' }
  await setSetting('paymentFees', { percentBp: Math.round(pct * 100), fixedCents: fixed })
  refreshAll()
  return { ok: 'Comisión guardada. Se aplica a los pedidos que se cobren a partir de ahora.' }
}

const companySchema = z.object({
  legalName: z.string().trim().max(200),
  taxId: z.string().trim().max(30),
  address: z.string().trim().max(300),
  email: z.union([z.literal(''), z.email('Email no válido').max(200)]),
  phone: z.string().trim().max(30),
})

export async function saveCompany(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  await requireAdmin()
  const parsed = companySchema.safeParse(Object.fromEntries(['legalName', 'taxId', 'address', 'email', 'phone'].map((k) => [k, String(formData.get(k) ?? '').trim()])))
  if (!parsed.success) return { error: 'Revisa los campos marcados.', fields: fieldErrors(parsed.error) }
  await setSetting('company', parsed.data)
  refreshAll()
  return { ok: 'Datos de la empresa guardados.' }
}

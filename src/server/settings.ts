import 'server-only'
import { prisma } from './db'

export interface CompanyInfo {
  legalName: string
  taxId: string
  address: string
  email: string
  phone: string
}

const DEFAULT_VAT_BP = 2100

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await prisma.setting.findUnique({ where: { key } })
  return (row?.value as T) ?? fallback
}

export async function setSetting(key: string, value: unknown) {
  await prisma.setting.upsert({ where: { key }, update: { value: value as object }, create: { key, value: value as object } })
}

/** IVA general en puntos básicos (2100 = 21 %) */
export const getVatRateBp = () => getSetting<number>('vatRateBp', DEFAULT_VAT_BP)

/**
 * Comisión de la pasarela de pago: porcentaje (puntos básicos) + fijo (céntimos) por cobro.
 * Por defecto, la tarifa estándar de Stripe para tarjetas del EEE: 1,5 % + 0,25 €.
 */
export interface PaymentFees {
  percentBp: number
  fixedCents: number
}
export const getPaymentFees = () => getSetting<PaymentFees>('paymentFees', { percentBp: 150, fixedCents: 25 })

export const paymentFeeFor = (totalCents: number, fees: PaymentFees) =>
  totalCents > 0 ? Math.round((totalCents * fees.percentBp) / 10000) + fees.fixedCents : 0

export const getCompany = () =>
  getSetting<CompanyInfo>('company', { legalName: '', taxId: '', address: '', email: '', phone: '' })

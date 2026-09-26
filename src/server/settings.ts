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

export const getCompany = () =>
  getSetting<CompanyInfo>('company', { legalName: '', taxId: '', address: '', email: '', phone: '' })

import 'server-only'
import { prisma } from './db'
import { fromMadridLocal } from '@/lib/dates'
import { SALE_STATUSES } from '@/lib/orderStatus'

// Cifras del negocio para el dashboard. Todo en céntimos.
// Criterio: una venta cuenta el día en que se COBRA (paidAt), en hora de Madrid.
// Costes sin IVA (el IVA soportado se recupera en la declaración trimestral).

export type PeriodKey = 'hoy' | '7d' | '30d' | 'mes' | 'mes-pasado'

export const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'hoy', label: 'Hoy' },
  { key: '7d', label: '7 días' },
  { key: '30d', label: '30 días' },
  { key: 'mes', label: 'Este mes' },
  { key: 'mes-pasado', label: 'Mes pasado' },
]

const TZ = 'Europe/Madrid'
/** "2026-09-29" de una fecha, en hora de Madrid */
export const madridDay = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: TZ })
const addDays = (day: string, n: number) => {
  const d = new Date(`${day}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
const startOf = (day: string) => fromMadridLocal(`${day}T00:00`)

export function resolvePeriod(key: string | undefined) {
  const today = madridDay(new Date())
  const k = (PERIODS.some((p) => p.key === key) ? key : '30d') as PeriodKey
  const [y, m] = today.split('-').map(Number)
  const monthStart = `${y}-${String(m).padStart(2, '0')}-01`
  const prevMonthStart = m === 1 ? `${y - 1}-12-01` : `${y}-${String(m - 1).padStart(2, '0')}-01`
  const ranges: Record<PeriodKey, [string, string]> = {
    hoy: [today, addDays(today, 1)],
    '7d': [addDays(today, -6), addDays(today, 1)],
    '30d': [addDays(today, -29), addDays(today, 1)],
    mes: [monthStart, addDays(today, 1)],
    'mes-pasado': [prevMonthStart, monthStart],
  }
  const [fromDay, toDay] = ranges[k]
  return { key: k, label: PERIODS.find((p) => p.key === k)!.label, fromDay, toDay, from: startOf(fromDay), to: startOf(toDay) }
}

export interface ProfitReport {
  orders: number
  revenueCents: number // cobrado, IVA incluido (pedidos no reembolsados ni cancelados)
  vatCents: number
  netSalesCents: number // ingresos sin IVA
  productCostCents: number
  shippingCostCents: number
  paymentFeesCents: number
  refunds: number
  refundLossCents: number // lo que se pierde en reembolsos: comisión y, si ya se produjo, prenda y envío
  profitCents: number
  marginPct: number | null
  ordersMissingCosts: number
}

const PRODUCED_JOB = ['SUBMITTED', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED']

export async function profitReport(from: Date, to: Date): Promise<ProfitReport> {
  const orders = await prisma.order.findMany({
    where: { paidAt: { gte: from, lt: to } },
    select: {
      status: true,
      totalCents: true,
      taxCents: true,
      shippingCostCents: true,
      paymentFeeCents: true,
      costsKnown: true,
      items: { select: { unitCostCents: true, quantity: true } },
      fulfillments: { select: { status: true } },
    },
  })
  const r: ProfitReport = {
    orders: 0,
    revenueCents: 0,
    vatCents: 0,
    netSalesCents: 0,
    productCostCents: 0,
    shippingCostCents: 0,
    paymentFeesCents: 0,
    refunds: 0,
    refundLossCents: 0,
    profitCents: 0,
    marginPct: null,
    ordersMissingCosts: 0,
  }
  for (const o of orders) {
    const goods = o.items.reduce((n, i) => n + (i.unitCostCents ?? 0) * i.quantity, 0)
    if (SALE_STATUSES.includes(o.status)) {
      r.orders++
      r.revenueCents += o.totalCents
      r.vatCents += o.taxCents
      r.productCostCents += goods
      r.shippingCostCents += o.shippingCostCents
      r.paymentFeesCents += o.paymentFeeCents
      if (!o.costsKnown) r.ordersMissingCosts++
    } else if (o.status === 'REFUNDED' || o.status === 'CANCELLED') {
      // Cobrado y devuelto: la comisión no se recupera; si ya se produjo, la prenda y el envío tampoco
      r.refunds++
      const produced = o.fulfillments.some((f) => PRODUCED_JOB.includes(f.status))
      r.refundLossCents += o.paymentFeeCents + (produced ? goods + o.shippingCostCents : 0)
    }
  }
  r.netSalesCents = r.revenueCents - r.vatCents
  r.profitCents = r.netSalesCents - r.productCostCents - r.shippingCostCents - r.paymentFeesCents - r.refundLossCents
  r.marginPct = r.netSalesCents > 0 ? Math.round((r.profitCents / r.netSalesCents) * 1000) / 10 : null
  return r
}

export interface DayPoint {
  day: string // 2026-09-29
  revenueCents: number
  orders: number
}

/** Ventas cobradas por día (hora de Madrid) entre dos días, ambos incluidos los que falten con 0. */
export async function dailySales(fromDay: string, toDayExclusive: string): Promise<DayPoint[]> {
  const orders = await prisma.order.findMany({
    where: { status: { in: SALE_STATUSES }, paidAt: { gte: startOf(fromDay), lt: startOf(toDayExclusive) } },
    select: { paidAt: true, totalCents: true },
  })
  const byDay = new Map<string, DayPoint>()
  for (let d = fromDay; d < toDayExclusive; d = addDays(d, 1)) byDay.set(d, { day: d, revenueCents: 0, orders: 0 })
  for (const o of orders) {
    const p = byDay.get(madridDay(o.paidAt!))
    if (p) {
      p.revenueCents += o.totalCents
      p.orders++
    }
  }
  return [...byDay.values()]
}

/** Para el gráfico: al menos 14 días aunque el periodo sea más corto (p. ej. "Hoy"). */
export function chartRange(period: ReturnType<typeof resolvePeriod>) {
  const days = Math.round((startOf(period.toDay).getTime() - startOf(period.fromDay).getTime()) / 86_400_000)
  return days >= 14 ? [period.fromDay, period.toDay] : [addDays(period.toDay, -14), period.toDay]
}

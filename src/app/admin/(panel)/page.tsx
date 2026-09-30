import Link from 'next/link'
import { prisma } from '@/server/db'
import { lowStockVariants } from '@/server/products'
import { chartRange, dailySales, PERIODS, profitReport, resolvePeriod } from '@/server/analytics'
import { getPaymentFees } from '@/server/settings'
import { formatCents } from '@/lib/catalog'
import { STATUS_BADGE, STATUS_LABEL } from '@/lib/orderStatus'
import SalesChart from './SalesChart'

export const metadata = { title: 'Dashboard' }

const DAY = 86_400_000
const dateFmt = new Intl.DateTimeFormat('es-ES', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Madrid' })

function Row({ label, value, sign = '−', strong = false, hint }: { label: string; value: number; sign?: '−' | '+' | '='; strong?: boolean; hint?: string }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 py-2 ${strong ? 'border-t border-washed-black/20 font-medium' : ''}`}>
      <dt className="text-sm">
        <span className="mr-2 inline-block w-3 text-washed-black/50" aria-hidden="true">
          {sign === '+' ? '' : sign}
        </span>
        {label}
        {hint && <span className="ml-2 text-[11px] font-normal text-washed-black/50">{hint}</span>}
      </dt>
      <dd className={`text-sm tabular-nums ${strong ? 'text-base' : ''} ${strong && value < 0 ? 'text-terracotta' : ''}`}>{formatCents(value)}</dd>
    </div>
  )
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ periodo?: string }> }) {
  const { periodo } = await searchParams
  const period = resolvePeriod(periodo)
  const [chartFrom, chartTo] = chartRange(period)
  const now = Date.now()

  const [report, today, series, fees, recent, needsReview, stuck, allLowStock] = await Promise.all([
    profitReport(period.from, period.to),
    profitReport(resolvePeriod('hoy').from, resolvePeriod('hoy').to),
    dailySales(chartFrom, chartTo),
    getPaymentFees(),
    prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 6, include: { customer: { select: { name: true } } } }),
    prisma.order.findMany({ where: { status: 'NEEDS_REVIEW' }, orderBy: { updatedAt: 'desc' }, take: 10 }),
    prisma.order.findMany({ where: { status: 'PAID', paidAt: { lt: new Date(now - 2 * DAY) } }, orderBy: { paidAt: 'asc' }, take: 10 }),
    lowStockVariants(1000),
  ])
  const lowStock = allLowStock.slice(0, 6)
  const attention = [
    ...needsReview.map((o) => ({ id: o.id, number: o.number, reason: 'Requiere revisión' })),
    ...stuck.map((o) => ({ id: o.id, number: o.number, reason: 'Pagado hace más de 48 h sin enviar a producción ni enviar' })),
  ]

  const kpis = [
    { label: `Pedidos · ${period.label.toLowerCase()}`, value: String(report.orders) },
    { label: `Ingresos · ${period.label.toLowerCase()}`, value: formatCents(report.revenueCents) },
    { label: 'Ticket medio', value: report.orders ? formatCents(Math.round(report.revenueCents / report.orders)) : '—' },
    {
      label: 'Beneficio neto',
      value: formatCents(report.profitCents),
      sub: report.marginPct != null ? `${report.marginPct.toLocaleString('es-ES')} % de las ventas netas` : undefined,
      negative: report.profitCents < 0,
    },
  ]

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="admin-h1">Dashboard</h1>
          <p className="mt-2 text-sm text-washed-black/60">
            Hoy: {today.orders} pedido{today.orders === 1 ? '' : 's'} · {formatCents(today.revenueCents)}
          </p>
        </div>
        <nav aria-label="Periodo" className="flex flex-wrap gap-1">
          {PERIODS.map((p) => (
            <Link
              key={p.key}
              href={`/admin?periodo=${p.key}`}
              aria-current={p.key === period.key ? 'page' : undefined}
              className={p.key === period.key ? 'btn-primary px-3 py-1.5' : 'btn-secondary px-3 py-1.5'}
            >
              {p.label}
            </Link>
          ))}
        </nav>
      </header>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Indicadores del periodo">
        {kpis.map((k) => (
          <div key={k.label} className="admin-card">
            <p className={`text-2xl font-light tabular-nums md:text-3xl ${k.negative ? 'text-terracotta' : ''}`}>{k.value}</p>
            <p className="label mt-3 text-washed-black/60">{k.label}</p>
            {k.sub && <p className="mt-1 text-[11px] text-washed-black/55">{k.sub}</p>}
          </div>
        ))}
      </section>

      {attention.length > 0 && (
        <section className="border border-terracotta/40 bg-terracotta/5 p-5 md:p-7" aria-labelledby="atencion">
          <h2 id="atencion" className="admin-h2 text-terracotta">
            Requieren atención ({attention.length})
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            {attention.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2">
                <Link href={`/admin/pedidos/${a.id}`} className="font-mono text-xs font-medium underline underline-offset-4">
                  {a.number}
                </Link>
                <span className="text-xs text-washed-black/70">{a.reason}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <section className="admin-card" aria-labelledby="ventas-diarias">
          <h2 id="ventas-diarias" className="admin-h2">
            Ventas diarias (IVA incluido)
          </h2>
          <div className="mt-5">
            <SalesChart data={series} />
          </div>
        </section>

        <section className="admin-card" aria-labelledby="desglose">
          <h2 id="desglose" className="admin-h2">
            ¿Cuánto ganamos? · {period.label.toLowerCase()}
          </h2>
          <dl className="mt-4">
            <Row label="Ingresos cobrados" value={report.revenueCents} sign="+" hint="IVA incluido" />
            <Row label="IVA repercutido" value={report.vatCents} hint="se ingresa a Hacienda" />
            <Row label="Ventas netas" value={report.netSalesCents} sign="=" strong />
            <Row label="Coste de producto" value={report.productCostCents} hint="proveedor" />
            <Row label="Envíos" value={report.shippingCostCents} hint="transportista" />
            <Row
              label="Comisiones de pago"
              value={report.paymentFeesCents}
              hint={`${(fees.percentBp / 100).toLocaleString('es-ES')} % + ${formatCents(fees.fixedCents)}`}
            />
            {report.refunds > 0 && <Row label={`Pérdidas por reembolsos (${report.refunds})`} value={report.refundLossCents} hint="comisión y producción" />}
            <Row label="Beneficio neto" value={report.profitCents} sign="=" strong />
          </dl>
          <p className="mt-4 text-[11px] leading-5 text-washed-black/55">
            Antes de impuestos trimestrales y anuales (IVA a pagar = repercutido − soportado, e Impuesto de Sociedades). Costes sin IVA.
            {report.ordersMissingCosts > 0 && (
              <span className="mt-2 block text-terracotta">
                {report.ordersMissingCosts} pedido(s) tienen productos sin coste indicado: su beneficio aparece más alto de lo real. Indica el coste
                en cada producto.
              </span>
            )}
          </p>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="admin-card">
          <div className="flex items-center justify-between">
            <h2 className="admin-h2">Pedidos recientes</h2>
            <Link href="/admin/pedidos" className="text-[10px] uppercase tracking-[0.2em] text-washed-black/60 hover:text-washed-black">
              Todos →
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="mt-6 text-sm text-washed-black/60">Todavía no hay pedidos.</p>
          ) : (
            <table className="admin-table mt-4">
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link href={`/admin/pedidos/${o.id}`} className="font-mono text-xs font-medium hover:underline">
                        {o.number}
                      </Link>
                      <span className="block text-xs text-washed-black/55">
                        {o.customer.name} · {dateFmt.format(o.createdAt)}
                      </span>
                    </td>
                    <td className="text-right tabular-nums">{formatCents(o.totalCents)}</td>
                    <td className="text-right">
                      <span className={`badge ${STATUS_BADGE[o.status]}`}>{STATUS_LABEL[o.status]}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="admin-card">
          <div className="flex items-center justify-between">
            <h2 className="admin-h2">Stock bajo ({allLowStock.length})</h2>
            <Link href="/admin/inventario?bajo=1" className="text-[10px] uppercase tracking-[0.2em] text-washed-black/60 hover:text-washed-black">
              Inventario →
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="mt-6 text-sm text-washed-black/60">Todo en orden: ninguna variante por debajo de su aviso.</p>
          ) : (
            <table className="admin-table mt-4">
              <tbody>
                {lowStock.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <Link href={`/admin/productos/${v.product.id}`} className="hover:underline">
                        {v.product.name}
                      </Link>
                      <span className="block text-xs text-washed-black/55">
                        {v.color.name} · {v.size} · {v.sku}
                      </span>
                    </td>
                    <td className={`text-right tabular-nums ${v.stock === 0 ? 'text-terracotta' : ''}`}>{v.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  )
}

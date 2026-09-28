import Link from 'next/link'
import { prisma } from '@/server/db'
import { lowStockVariants } from '@/server/products'
import { formatCents } from '@/lib/catalog'
import { SALE_STATUSES, STATUS_BADGE, STATUS_LABEL } from '@/lib/orderStatus'

export const metadata = { title: 'Dashboard' }

const DAY = 86_400_000
const dateFmt = new Intl.DateTimeFormat('es-ES', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Madrid' })

export default async function DashboardPage() {
  const now = Date.now()
  const since30 = new Date(now - 30 * DAY)
  const [sales30, salesToday, recent, needsReview, stuck, published, allLowStock, zones] = await Promise.all([
    prisma.order.aggregate({ where: { status: { in: SALE_STATUSES }, paidAt: { gte: since30 } }, _sum: { totalCents: true }, _count: true }),
    prisma.order.aggregate({
      where: { status: { in: SALE_STATUSES }, paidAt: { gte: new Date(new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' })) } },
      _sum: { totalCents: true },
      _count: true,
    }),
    prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 6, include: { customer: { select: { name: true } } } }),
    prisma.order.findMany({ where: { status: 'NEEDS_REVIEW' }, orderBy: { updatedAt: 'desc' }, take: 10 }),
    // Pagados hace más de 48 h que no han avanzado (ni a producción ni enviados)
    prisma.order.findMany({ where: { status: 'PAID', paidAt: { lt: new Date(now - 2 * DAY) } }, orderBy: { paidAt: 'asc' }, take: 10 }),
    prisma.product.count({ where: { status: 'PUBLISHED' } }),
    lowStockVariants(1000),
    prisma.shippingZone.findMany({ orderBy: { sortOrder: 'asc' } }),
  ])
  const lowStock = allLowStock.slice(0, 6)
  const revenue30 = sales30._sum.totalCents ?? 0
  const attention = [
    ...needsReview.map((o) => ({ id: o.id, number: o.number, reason: 'Requiere revisión' })),
    ...stuck.map((o) => ({ id: o.id, number: o.number, reason: 'Pagado hace más de 48 h sin enviar a producción ni enviar' })),
  ]

  const stats = [
    { label: 'Ventas últimos 30 días', value: formatCents(revenue30), href: '/admin/pedidos' },
    { label: 'Pedidos últimos 30 días', value: sales30._count, href: '/admin/pedidos' },
    { label: 'Ticket medio', value: sales30._count ? formatCents(Math.round(revenue30 / sales30._count)) : '—', href: '/admin/pedidos' },
    { label: `Hoy · ${salesToday._count} pedido(s)`, value: formatCents(salesToday._sum.totalCents ?? 0), href: '/admin/pedidos' },
  ]

  return (
    <div className="space-y-10">
      <header>
        <h1 className="admin-h1">Dashboard</h1>
        <p className="mt-2 text-sm text-washed-black/60">
          Resumen de la tienda · {published} productos publicados. Las ventas cuentan los pedidos cobrados (no los reembolsados ni cancelados).
        </p>
      </header>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Indicadores">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="admin-card transition-colors hover:border-washed-black/30">
            <p className="text-2xl font-light tabular-nums md:text-3xl">{s.value}</p>
            <p className="label mt-3 text-washed-black/60">{s.label}</p>
          </Link>
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
          <h2 className="admin-h2 mt-8">Zonas de envío</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {zones.map((z) => (
              <li key={z.id} className="flex items-center justify-between">
                <span>{z.name}</span>
                <span className={`badge ${z.active ? 'bg-sage/25 text-washed-black' : 'bg-washed-black/5 text-washed-black/50'}`}>
                  {z.active ? 'Activa' : 'Desactivada'}
                </span>
              </li>
            ))}
          </ul>
          <Link href="/admin/configuracion" className="field-hint mt-4 inline-block underline underline-offset-4">
            Editar en Configuración
          </Link>
        </section>
      </div>
    </div>
  )
}

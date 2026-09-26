import Link from 'next/link'
import { prisma } from '@/server/db'
import { formatCents } from '@/lib/catalog'
import { ORDER_STATUSES, STATUS_BADGE, STATUS_LABEL, type OrderStatusValue } from '@/lib/orderStatus'
import type { Prisma } from '@/generated/prisma/client'

export const metadata = { title: 'Pedidos' }

const PAGE_SIZE = 50
const dateFmt = new Intl.DateTimeFormat('es-ES', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Madrid' })

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ q?: string; estado?: string; pagina?: string }> }) {
  const { q = '', estado = '', pagina = '1' } = await searchParams
  const page = Math.max(1, parseInt(pagina, 10) || 1)
  const status = (ORDER_STATUSES as readonly string[]).includes(estado) ? (estado as OrderStatusValue) : undefined
  const where: Prisma.OrderWhereInput = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { number: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { customer: { name: { contains: q, mode: 'insensitive' } } },
          ],
        }
      : {}),
  }
  const [orders, total, counts] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: { customer: { select: { name: true } }, _count: { select: { items: true } } },
    }),
    prisma.order.count({ where }),
    prisma.order.groupBy({ by: ['status'], _count: true }),
  ])
  const countOf = (s: OrderStatusValue) => counts.find((c) => c.status === s)?._count ?? 0
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const qs = (p: Record<string, string | number>) => '?' + new URLSearchParams({ ...(q ? { q } : {}), ...(estado ? { estado } : {}), ...Object.fromEntries(Object.entries(p).map(([k, v]) => [k, String(v)])) }).toString()

  return (
    <div className="space-y-8">
      <header>
        <h1 className="admin-h1">Pedidos</h1>
        <p className="mt-2 text-sm text-washed-black/60">{total} pedidos</p>
      </header>

      {countOf('NEEDS_REVIEW') > 0 && (
        <Link href="/admin/pedidos?estado=NEEDS_REVIEW" className="alert-error block">
          {countOf('NEEDS_REVIEW')} pedido(s) requieren revisión →
        </Link>
      )}

      <form className="flex flex-wrap items-end gap-3" role="search">
        <div className="min-w-[220px] flex-1">
          <label htmlFor="q" className="field-label">
            Buscar
          </label>
          <input id="q" name="q" defaultValue={q} placeholder="Número, email o nombre" className="input" />
        </div>
        <div>
          <label htmlFor="estado" className="field-label">
            Estado
          </label>
          <select id="estado" name="estado" defaultValue={estado} className="input">
            <option value="">Todos</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]} ({countOf(s)})
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-secondary py-2.5">
          Filtrar
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="admin-table min-w-[760px]">
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Artículos</th>
              <th className="text-right">Total</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-white/60">
                <td>
                  <Link href={`/admin/pedidos/${o.id}`} className="font-mono text-xs font-medium hover:underline">
                    {o.number}
                  </Link>
                </td>
                <td className="whitespace-nowrap text-xs text-washed-black/70">{dateFmt.format(o.createdAt)}</td>
                <td>
                  {o.customer.name}
                  <span className="block text-xs text-washed-black/55">{o.email}</span>
                </td>
                <td className="text-xs">{o._count.items}</td>
                <td className="text-right tabular-nums">{formatCents(o.totalCents)}</td>
                <td>
                  <span className={`badge ${STATUS_BADGE[o.status]}`}>{STATUS_LABEL[o.status]}</span>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-washed-black/60">
                  No hay pedidos{q || estado ? ' con esos filtros' : ' todavía'}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <nav className="flex items-center justify-between text-xs" aria-label="Paginación">
          {page > 1 ? <Link href={qs({ pagina: page - 1 })} className="btn-secondary">← Anteriores</Link> : <span />}
          <span className="text-washed-black/60">
            Página {page} de {pages}
          </span>
          {page < pages ? <Link href={qs({ pagina: page + 1 })} className="btn-secondary">Siguientes →</Link> : <span />}
        </nav>
      )}
    </div>
  )
}

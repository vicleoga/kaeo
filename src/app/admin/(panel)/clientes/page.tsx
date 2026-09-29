import Link from 'next/link'
import { prisma } from '@/server/db'
import { formatCents } from '@/lib/catalog'
import { SALE_STATUSES } from '@/lib/orderStatus'

export const metadata = { title: 'Clientes' }

const dateFmt = new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeZone: 'Europe/Madrid' })

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams
  const customers = await prisma.customer.findMany({
    where: q ? { OR: [{ email: { contains: q, mode: 'insensitive' } }, { name: { contains: q, mode: 'insensitive' } }] } : {},
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { orders: { select: { totalCents: true, status: true, createdAt: true }, orderBy: { createdAt: 'desc' } } },
  })

  return (
    <div className="space-y-8">
      <header>
        <h1 className="admin-h1">Clientes</h1>
        <p className="mt-2 text-sm text-washed-black/60">Se crean automáticamente al comprar (no hace falta cuenta).</p>
      </header>

      <form className="flex max-w-md items-end gap-3" role="search">
        <div className="flex-1">
          <label htmlFor="q" className="field-label">
            Buscar
          </label>
          <input id="q" name="q" defaultValue={q} placeholder="Nombre o email" className="input" />
        </div>
        <button type="submit" className="btn-secondary py-2.5">
          Buscar
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="admin-table min-w-[720px]">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Pedidos</th>
              <th className="text-right">Gastado</th>
              <th>Último pedido</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => {
              const sales = c.orders.filter((o) => SALE_STATUSES.includes(o.status))
              return (
                <tr key={c.id}>
                  <td>
                    {c.name}
                    <span className="block text-xs text-washed-black/55">{c.email}</span>
                  </td>
                  <td>
                    <Link href={`/admin/pedidos?q=${encodeURIComponent(c.email)}`} className="hover:underline">
                      {c.orders.length}
                    </Link>
                  </td>
                  <td className="text-right tabular-nums">{formatCents(sales.reduce((n, o) => n + o.totalCents, 0))}</td>
                  <td className="text-xs text-washed-black/70">{c.orders[0] ? dateFmt.format(c.orders[0].createdAt) : '—'}</td>
                </tr>
              )
            })}
            {customers.length === 0 && (
              <tr>
                <td colSpan={4} className="py-10 text-center text-washed-black/60">
                  Todavía no hay clientes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

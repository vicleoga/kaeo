import Link from 'next/link'
import { prisma } from '@/server/db'
import { lowStockVariants } from '@/server/products'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const [published, drafts, variants, allLowStock, zones] = await Promise.all([
    prisma.product.count({ where: { status: 'PUBLISHED' } }),
    prisma.product.count({ where: { status: 'DRAFT' } }),
    prisma.variant.count({ where: { active: true } }),
    lowStockVariants(1000),
    prisma.shippingZone.findMany({ orderBy: { sortOrder: 'asc' } }),
  ])
  const lowStock = allLowStock.slice(0, 8)

  const stats = [
    { label: 'Productos publicados', value: published, href: '/admin/productos?estado=PUBLISHED' },
    { label: 'Borradores', value: drafts, href: '/admin/productos?estado=DRAFT' },
    { label: 'Variantes activas', value: variants, href: '/admin/productos' },
    { label: 'Stock bajo', value: allLowStock.length, href: '/admin/inventario?bajo=1' },
  ]

  return (
    <div className="space-y-10">
      <header>
        <h1 className="admin-h1">Dashboard</h1>
        <p className="mt-2 text-sm text-washed-black/60">Resumen de la tienda.</p>
      </header>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Indicadores">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="admin-card transition-colors hover:border-washed-black/30">
            <p className="text-3xl font-light">{s.value}</p>
            <p className="label mt-3 text-washed-black/60">{s.label}</p>
          </Link>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="admin-card">
          <div className="flex items-center justify-between">
            <h2 className="admin-h2">Requiere atención · stock bajo</h2>
            <Link href="/admin/inventario?bajo=1" className="text-[10px] uppercase tracking-[0.2em] text-washed-black/60 hover:text-washed-black">
              Inventario →
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="mt-6 text-sm text-washed-black/60">Todo en orden: ninguna variante por debajo de su aviso.</p>
          ) : (
            <table className="admin-table mt-4">
              <thead>
                <tr>
                  <th>Variante</th>
                  <th className="text-right">Stock</th>
                </tr>
              </thead>
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

        <section className="admin-card">
          <h2 className="admin-h2">Ventas y pedidos</h2>
          <p className="mt-6 text-sm leading-6 text-washed-black/60">
            Las ventas, los pedidos recientes y los pedidos que requieren revisión aparecerán aquí en la fase 4, cuando la tienda
            tenga checkout.
          </p>
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
          <p className="field-hint mt-4">Se podrán editar desde Configuración en la fase 4.</p>
        </section>
      </div>
    </div>
  )
}

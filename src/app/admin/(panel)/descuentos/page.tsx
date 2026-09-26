import Link from 'next/link'
import { prisma } from '@/server/db'
import { formatCents } from '@/lib/catalog'
import DiscountForm from './DiscountForm'

export const metadata = { title: 'Descuentos' }

const dateFmt = new Intl.DateTimeFormat('es-ES', { dateStyle: 'short', timeZone: 'Europe/Madrid' })

export default async function DiscountsPage({ searchParams }: { searchParams: Promise<{ creado?: string }> }) {
  const { creado } = await searchParams
  const codes = await prisma.discountCode.findMany({ orderBy: [{ active: 'desc' }, { createdAt: 'desc' }] })
  const now = new Date()

  return (
    <div className="space-y-8">
      <header>
        <h1 className="admin-h1">Códigos de descuento</h1>
        <p className="mt-2 text-sm text-washed-black/60">Un código por pedido. El uso se cuenta cuando el pedido se paga.</p>
      </header>
      {creado && <p className="alert-ok">Código creado.</p>}

      <div className="overflow-x-auto">
        <table className="admin-table min-w-[720px]">
          <thead>
            <tr>
              <th>Código</th>
              <th>Descuento</th>
              <th>Condiciones</th>
              <th>Usos</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {codes.map((c) => {
              const expired = c.expiresAt && c.expiresAt < now
              const exhausted = c.maxUses != null && c.usedCount >= c.maxUses
              const state = !c.active ? 'Inactivo' : expired ? 'Caducado' : exhausted ? 'Agotado' : 'Activo'
              return (
                <tr key={c.id}>
                  <td>
                    <Link href={`/admin/descuentos/${c.id}`} className="font-mono font-medium hover:underline">
                      {c.code}
                    </Link>
                    {c.description && <span className="block text-xs text-washed-black/55">{c.description}</span>}
                  </td>
                  <td>{c.type === 'PERCENT' ? `${c.value / 100} %` : formatCents(c.value)}</td>
                  <td className="text-xs text-washed-black/70">
                    {c.minSubtotalCents ? `Mín. ${formatCents(c.minSubtotalCents)}` : 'Sin mínimo'}
                    {c.startsAt && ` · desde ${dateFmt.format(c.startsAt)}`}
                    {c.expiresAt && ` · hasta ${dateFmt.format(c.expiresAt)}`}
                  </td>
                  <td className="tabular-nums">
                    {c.usedCount}
                    {c.maxUses != null && ` / ${c.maxUses}`}
                  </td>
                  <td>
                    <span className={`badge ${state === 'Activo' ? 'bg-sage/25' : 'bg-washed-black/5 text-washed-black/60'}`}>{state}</span>
                  </td>
                </tr>
              )
            })}
            {codes.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-washed-black/60">
                  No hay códigos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <DiscountForm />
    </div>
  )
}

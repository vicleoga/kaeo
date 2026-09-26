import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/server/db'
import { centsToInput } from '@/lib/catalog'
import { toMadridLocal as toLocalInput } from '@/lib/dates'
import DiscountForm from '../DiscountForm'
import { deleteDiscount } from '../actions'

export const metadata = { title: 'Editar descuento' }

export default async function EditDiscountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const d = await prisma.discountCode.findUnique({ where: { id } })
  if (!d) notFound()
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/admin/descuentos" className="text-[10px] uppercase tracking-[0.2em] text-washed-black/60 hover:text-washed-black">
            ← Descuentos
          </Link>
          <h1 className="admin-h1 mt-4 font-mono">{d.code}</h1>
          <p className="mt-2 text-sm text-washed-black/60">Usado {d.usedCount} veces</p>
        </div>
        <form action={deleteDiscount.bind(null, d.id)}>
          <button className="btn-danger">{d.usedCount > 0 ? 'Desactivar' : 'Borrar'}</button>
        </form>
      </header>
      <DiscountForm
        id={d.id}
        initial={{
          code: d.code,
          type: d.type,
          value: d.type === 'PERCENT' ? String(d.value / 100).replace('.', ',') : centsToInput(d.value),
          minSubtotal: centsToInput(d.minSubtotalCents),
          startsAt: toLocalInput(d.startsAt),
          expiresAt: toLocalInput(d.expiresAt),
          maxUses: d.maxUses == null ? '' : String(d.maxUses),
          active: d.active,
          description: d.description,
        }}
      />
    </div>
  )
}

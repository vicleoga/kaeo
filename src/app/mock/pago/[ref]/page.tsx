import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/server/db'
import { isMockPayment } from '@/server/providers/payment'
import { formatCents } from '@/lib/catalog'
import { simulatePayment } from './actions'

export const metadata: Metadata = { title: 'Pasarela de pago de pruebas', robots: { index: false } }

// Página de la pasarela SIMULADA. Solo existe con PAYMENT_PROVIDER=mock.
export default async function MockPaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ ref: string }>
  searchParams: Promise<{ volver?: string }>
}) {
  if (!isMockPayment()) notFound()
  const { ref } = await params
  const { volver } = await searchParams
  const payment = await prisma.payment.findUnique({ where: { providerRef: ref }, include: { order: true } })
  if (!payment) notFound()

  const done = payment.status !== 'PENDING'
  const back = volver ?? `/pedido/${payment.order.number}?t=${payment.order.accessToken}`

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#eceef1] px-5 py-16 font-sans">
      <div className="w-full max-w-md border border-black/10 bg-white p-8 shadow-sm">
        <p className="inline-block bg-amber-100 px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-amber-800">Entorno de pruebas · no se cobra nada</p>
        <h1 className="mt-6 text-lg font-medium">Pasarela de pago simulada</h1>
        <p className="mt-1 text-sm text-black/60">Sustituye a Stripe (u otro) mientras no hay proveedor real.</p>

        <dl className="mt-8 space-y-3 border-y border-black/10 py-5 text-sm">
          <div className="flex justify-between">
            <dt className="text-black/60">Comercio</dt>
            <dd>KAEO</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-black/60">Pedido</dt>
            <dd className="font-mono">{payment.order.number}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-black/60">Email</dt>
            <dd>{payment.order.email}</dd>
          </div>
          <div className="flex justify-between text-base">
            <dt>Importe</dt>
            <dd className="font-medium">{formatCents(payment.amountCents)}</dd>
          </div>
        </dl>

        {done ? (
          <div className="mt-8 space-y-4 text-sm">
            <p>Este pago ya está {payment.status === 'SUCCEEDED' ? 'completado' : 'cerrado'}.</p>
            <a href={back} className="block bg-black py-3 text-center text-white">
              Volver a la tienda
            </a>
          </div>
        ) : (
          <form className="mt-8 space-y-3">
            <input type="hidden" name="ref" value={ref} />
            <input type="hidden" name="volver" value={back} />
            <button formAction={simulatePayment.bind(null, 'succeeded')} className="w-full bg-emerald-700 py-3 text-sm font-medium text-white hover:bg-emerald-800">
              ✓ Simular pago correcto
            </button>
            <button formAction={simulatePayment.bind(null, 'failed')} className="w-full bg-red-700 py-3 text-sm font-medium text-white hover:bg-red-800">
              ✕ Simular pago fallido
            </button>
            <a href="/checkout" className="block py-2 text-center text-sm text-black/60 underline">
              Cancelar y volver al checkout
            </a>
          </form>
        )}
      </div>
    </main>
  )
}

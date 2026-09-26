import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { timingSafeEqual } from 'node:crypto'
import { prisma } from '@/server/db'
import { formatCents } from '@/lib/catalog'
import { CUSTOMER_STEPS, STATUS_LABEL, type OrderStatusValue } from '@/lib/orderStatus'
import type { ShippingAddress } from '@/server/providers/fulfillment'
import { AutoRefresh, ClearCartOnSuccess, RetryPaymentButton } from './OrderClient'

export const metadata: Metadata = { title: 'Tu pedido', robots: { index: false } }

const sameToken = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b))

export default async function OrderPage({ params, searchParams }: { params: Promise<{ number: string }>; searchParams: Promise<{ t?: string }> }) {
  const { number } = await params
  const { t = '' } = await searchParams
  const order = await prisma.order.findUnique({
    where: { number },
    include: { items: true, fulfillments: { orderBy: { updatedAt: 'desc' } } },
  })
  // Sin token válido, el pedido "no existe" (no se revela si el número es real)
  if (!order || !sameToken(order.accessToken, t)) notFound()

  const status = order.status as OrderStatusValue
  const address = order.shippingAddress as unknown as ShippingAddress
  const tracking = order.fulfillments.find((f) => f.trackingNumber)
  const firstName = address.name.split(' ')[0]
  const paidLike = !['PENDING_PAYMENT', 'PAYMENT_FAILED', 'CANCELLED'].includes(status)
  const currentStep = CUSTOMER_STEPS.findIndex((s) => s.status.includes(status))

  return (
    <div className="px-5 pb-28 pt-28 md:px-10 md:pt-36">
      {paidLike && <ClearCartOnSuccess />}
      <div className="mx-auto max-w-3xl">
        <p className="label text-washed-black/60">Pedido {order.number}</p>

        {status === 'PENDING_PAYMENT' && (
          <section className="mt-6" aria-live="polite">
            <h1 className="heading text-2xl">Procesando tu pago…</h1>
            <p className="mt-4 text-sm text-washed-black/70">Estamos esperando la confirmación del banco. Esta página se actualizará sola.</p>
            <AutoRefresh />
          </section>
        )}
        {status === 'PAYMENT_FAILED' && (
          <section className="mt-6">
            <h1 className="heading text-2xl">El pago no se ha completado</h1>
            <p className="mt-4 text-sm text-washed-black/70">No se ha realizado ningún cargo. Puedes volver a intentarlo con el mismo pedido.</p>
            <RetryPaymentButton number={order.number} token={order.accessToken} />
          </section>
        )}
        {(status === 'CANCELLED' || status === 'REFUNDED') && (
          <section className="mt-6">
            <h1 className="heading text-2xl">Pedido {STATUS_LABEL[status].toLowerCase()}</h1>
            <p className="mt-4 text-sm text-washed-black/70">
              {status === 'REFUNDED' ? 'Hemos devuelto el importe a tu método de pago; puede tardar unos días en aparecer.' : 'Este pedido está cancelado.'} Si
              tienes cualquier duda, escríbenos desde <Link href="/contacto" className="underline underline-offset-4">contacto</Link>.
            </p>
          </section>
        )}
        {paidLike && status !== 'REFUNDED' && (
          <section className="mt-6">
            <h1 className="heading text-2xl md:text-3xl">Gracias, {firstName}</h1>
            <p className="mt-4 font-script text-4xl text-washed-black/80">Good vibes further</p>
            <p className="mt-4 text-sm leading-7 text-washed-black/70">
              Hemos recibido tu pedido y te hemos enviado la confirmación a <strong className="font-medium">{order.email}</strong>. Guarda esta página
              para seguir el envío.
            </p>
            <ol className="mt-10 grid grid-cols-4 gap-2" aria-label="Estado del pedido">
              {CUSTOMER_STEPS.map((s, i) => (
                <li key={s.label} aria-current={i === currentStep ? 'step' : undefined}>
                  <span className={`block h-px ${i <= currentStep ? 'bg-washed-black' : 'bg-washed-black/15'}`} />
                  <span className={`mt-3 block text-[10px] uppercase tracking-[0.18em] ${i <= currentStep ? 'text-washed-black' : 'text-washed-black/40'}`}>{s.label}</span>
                </li>
              ))}
            </ol>
            {tracking && (
              <p className="alert-ok mt-8">
                Enviado con {tracking.carrier} · Nº de seguimiento <strong className="font-medium">{tracking.trackingNumber}</strong>
                {tracking.trackingUrl && (
                  <>
                    {' · '}
                    <a href={tracking.trackingUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                      Seguir envío
                    </a>
                  </>
                )}
              </p>
            )}
          </section>
        )}

        <section className="admin-card mt-12" aria-labelledby="resumen">
          <h2 id="resumen" className="label">
            Resumen
          </h2>
          <ul className="mt-4 divide-y divide-washed-black/10">
            {order.items.map((i) => (
              <li key={i.id} className="flex gap-4 py-4">
                {i.image && <img src={i.image} alt="" className="h-20 w-16 object-cover" />}
                <div className="flex-1">
                  <p className="text-[11px] font-medium uppercase tracking-[0.15em]">{i.productName}</p>
                  <p className="text-xs text-washed-black/60">
                    {i.colorName} · {i.size} · {i.quantity} ud.
                  </p>
                </div>
                <p className="text-sm tabular-nums">{formatCents(i.unitPriceCents * i.quantity)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-2 space-y-2 border-t border-washed-black/10 pt-4 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd className="tabular-nums">{formatCents(order.subtotalCents)}</dd>
            </div>
            {order.discountCents > 0 && (
              <div className="flex justify-between">
                <dt>Descuento {order.discountCode}</dt>
                <dd className="tabular-nums">−{formatCents(order.discountCents)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt>Envío · {order.shippingName}</dt>
              <dd className="tabular-nums">{order.shippingCents ? formatCents(order.shippingCents) : 'Gratis'}</dd>
            </div>
            <div className="flex justify-between border-t border-washed-black/10 pt-3 text-base font-medium">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatCents(order.totalCents)}</dd>
            </div>
            <p className="text-[11px] text-washed-black/55">IVA incluido ({formatCents(order.taxCents)})</p>
          </dl>
          <div className="mt-6 border-t border-washed-black/10 pt-4 text-sm leading-6">
            <p className="label mb-2">Envío a</p>
            <p>{address.name}</p>
            <p>
              {address.line1}
              {address.line2 ? `, ${address.line2}` : ''}
            </p>
            <p>
              {address.postalCode} {address.city} ({address.province})
            </p>
          </div>
        </section>

        <div className="mt-12 text-center">
          <Link href="/" className="btn-dark">
            Seguir mirando
          </Link>
        </div>
      </div>
    </div>
  )
}

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/server/db'
import { formatCents } from '@/lib/catalog'
import { STATUS_BADGE, STATUS_LABEL, TRANSITIONS } from '@/lib/orderStatus'
import { isMockFulfillment } from '@/server/providers/fulfillment'
import type { ShippingAddress } from '@/server/providers/fulfillment'
import OrderActions from './OrderActions'

export const metadata = { title: 'Pedido' }

const dateFmt = new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Madrid' })

const PAYMENT_LABEL = { PENDING: 'Pendiente', SUCCEEDED: 'Cobrado', FAILED: 'Fallido', REFUNDED: 'Reembolsado', PARTIALLY_REFUNDED: 'Reembolso parcial' } as const
const JOB_LABEL = { PENDING: 'Pendiente', SUBMITTED: 'Aceptado', IN_PRODUCTION: 'En producción', SHIPPED: 'Enviado', DELIVERED: 'Entregado', FAILED: 'Fallido', CANCELLED: 'Cancelado' } as const

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      items: true,
      events: { orderBy: { createdAt: 'desc' } },
      payments: { orderBy: { createdAt: 'desc' }, include: { refunds: true } },
      fulfillments: { orderBy: { createdAt: 'desc' } },
    },
  })
  if (!order) notFound()
  const address = order.shippingAddress as unknown as ShippingAddress
  const customerOrders = await prisma.order.count({ where: { customerId: order.customerId } })
  const hasOnDemand = order.items.some((i) => i.stockMode === 'ON_DEMAND')
  const mockJob = isMockFulfillment() ? order.fulfillments.find((f) => f.provider === 'mock' && f.providerRef) : undefined

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/admin/pedidos" className="text-[10px] uppercase tracking-[0.2em] text-washed-black/60 hover:text-washed-black">
            ← Pedidos
          </Link>
          <h1 className="admin-h1 mt-4 font-mono">{order.number}</h1>
          <p className="mt-2 text-sm text-washed-black/60">{dateFmt.format(order.createdAt)}</p>
        </div>
        <span className={`badge px-3 py-1 text-[10px] ${STATUS_BADGE[order.status]}`}>{STATUS_LABEL[order.status]}</span>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <section className="admin-card">
            <h2 className="admin-h2">Artículos</h2>
            <table className="admin-table mt-4">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>SKU</th>
                  <th>Tipo</th>
                  <th className="text-right">Cant.</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((i) => (
                  <tr key={i.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        {i.image && <img src={i.image} alt="" className="h-12 w-10 object-cover" />}
                        <div>
                          {i.productId ? (
                            <Link href={`/admin/productos/${i.productId}`} className="hover:underline">
                              {i.productName}
                            </Link>
                          ) : (
                            i.productName
                          )}
                          <span className="block text-xs text-washed-black/55">
                            {i.colorName} · {i.size} · {formatCents(i.unitPriceCents)}/ud. · IVA {i.vatRateBp / 100} %
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-xs">{i.sku}</td>
                    <td className="text-xs">{i.stockMode === 'ON_DEMAND' ? 'Bajo demanda' : 'Stock propio'}</td>
                    <td className="text-right">{i.quantity}</td>
                    <td className="text-right tabular-nums">{formatCents(i.totalCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="ml-auto mt-4 max-w-xs space-y-1.5 text-sm">
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
                <dt>Envío ({order.shippingZone})</dt>
                <dd className="tabular-nums">{formatCents(order.shippingCents)}</dd>
              </div>
              <div className="flex justify-between border-t border-washed-black/10 pt-1.5 font-medium">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatCents(order.totalCents)}</dd>
              </div>
              <div className="flex justify-between text-xs text-washed-black/60">
                <dt>IVA incluido</dt>
                <dd className="tabular-nums">{formatCents(order.taxCents)}</dd>
              </div>
            </dl>
          </section>

          <section className="admin-card">
            <h2 className="admin-h2">Historial</h2>
            <ol className="mt-4 space-y-4 border-l border-washed-black/15 pl-5">
              {order.events.map((e) => (
                <li key={e.id} className="relative text-sm">
                  <span className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-washed-black" aria-hidden="true" />
                  <p>
                    <span className={`badge mr-2 ${STATUS_BADGE[e.toStatus]}`}>{STATUS_LABEL[e.toStatus]}</span>
                    <span className="text-xs text-washed-black/55">
                      {dateFmt.format(e.createdAt)} · {e.actor}
                    </span>
                  </p>
                  {e.note && <p className="mt-1 text-xs text-washed-black/75">{e.note}</p>}
                </li>
              ))}
            </ol>
          </section>

          <section className="admin-card grid gap-6 md:grid-cols-2">
            <div>
              <h2 className="admin-h2">Pagos</h2>
              <ul className="mt-4 space-y-3 text-sm">
                {order.payments.map((p) => (
                  <li key={p.id}>
                    <p>
                      {formatCents(p.amountCents)} · {PAYMENT_LABEL[p.status]} <span className="text-xs text-washed-black/55">({p.provider})</span>
                    </p>
                    <p className="font-mono text-[11px] text-washed-black/50">{p.providerRef}</p>
                    {p.failureReason && <p className="text-xs text-terracotta">{p.failureReason}</p>}
                    {p.refunds.map((r) => (
                      <p key={r.id} className="text-xs text-washed-black/70">
                        Reembolso {formatCents(r.amountCents)} · {dateFmt.format(r.createdAt)} · {r.actor}
                        {r.reason ? ` · ${r.reason}` : ''}
                      </p>
                    ))}
                  </li>
                ))}
                {order.payments.length === 0 && <li className="text-washed-black/60">Sin pagos.</li>}
              </ul>
            </div>
            <div>
              <h2 className="admin-h2">Producción y envío</h2>
              <ul className="mt-4 space-y-3 text-sm">
                {order.fulfillments.map((f) => (
                  <li key={f.id}>
                    <p>
                      {JOB_LABEL[f.status]} <span className="text-xs text-washed-black/55">({f.provider}, {f.attempts} intento/s)</span>
                    </p>
                    {f.providerRef && <p className="font-mono text-[11px] text-washed-black/50">{f.providerRef}</p>}
                    {f.trackingNumber && (
                      <p className="text-xs">
                        {f.carrier} · {f.trackingUrl ? <a href={f.trackingUrl} target="_blank" rel="noreferrer" className="underline">{f.trackingNumber}</a> : f.trackingNumber}
                      </p>
                    )}
                    {f.lastError && <p className="text-xs text-terracotta">{f.lastError}</p>}
                  </li>
                ))}
                {order.fulfillments.length === 0 && (
                  <li className="text-washed-black/60">{hasOnDemand ? 'Aún no se ha enviado a producción.' : 'Solo stock propio: se envía a mano.'}</li>
                )}
              </ul>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="admin-card text-sm leading-6">
            <h2 className="admin-h2">Cliente</h2>
            <p className="mt-3 font-medium">{order.customer.name}</p>
            <p>
              <a href={`mailto:${order.email}`} className="hover:underline">
                {order.email}
              </a>
            </p>
            {address.phone && <p>{address.phone}</p>}
            <p className="mt-2 text-xs text-washed-black/60">
              <Link href={`/admin/pedidos?q=${encodeURIComponent(order.email)}`} className="hover:underline">
                {customerOrders} pedido(s) de este cliente
              </Link>
              {order.customer.marketingOptIn && ' · acepta newsletter'}
            </p>
            <h2 className="admin-h2 mt-6">Dirección de envío</h2>
            <p className="mt-3">{address.name}</p>
            <p>
              {address.line1}
              {address.line2 ? `, ${address.line2}` : ''}
            </p>
            <p>
              {address.postalCode} {address.city} ({address.province}) · {address.country}
            </p>
            <p className="mt-2 text-xs text-washed-black/60">{order.shippingName}</p>
            {order.customerNote && (
              <>
                <h2 className="admin-h2 mt-6">Nota del cliente</h2>
                <p className="mt-2 whitespace-pre-line text-washed-black/80">{order.customerNote}</p>
              </>
            )}
          </section>

          <OrderActions
            orderId={order.id}
            status={order.status}
            allowed={TRANSITIONS[order.status].filter((s) => s !== 'CANCELLED' && s !== 'REFUNDED')}
            canCancel={TRANSITIONS[order.status].includes('CANCELLED')}
            canRefund={TRANSITIONS[order.status].includes('REFUNDED')}
            canResend={hasOnDemand && ['PAID', 'NEEDS_REVIEW'].includes(order.status)}
            canShip={TRANSITIONS[order.status].includes('SHIPPED')}
            mock={mockJob ? { providerRef: mockJob.providerRef! } : null}
            internalNotes={order.internalNotes}
          />
        </aside>
      </div>
    </div>
  )
}

import Link from 'next/link'
import { prisma } from '@/server/db'
import { setHandled } from './actions'

export const metadata = { title: 'Mensajes' }

const dateFmt = new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Madrid' })

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
  const { ver } = await searchParams
  const showAll = ver === 'todos'
  const [messages, pending] = await Promise.all([
    prisma.contactMessage.findMany({ where: showAll ? {} : { handled: false }, orderBy: { createdAt: 'desc' }, take: 200 }),
    prisma.contactMessage.count({ where: { handled: false } }),
  ])
  const orders = await prisma.order.findMany({
    where: { number: { in: messages.map((m) => m.orderNumber).filter((n): n is string => !!n) } },
    select: { id: true, number: true },
  })
  const orderId = new Map(orders.map((o) => [o.number, o.id]))

  return (
    <div className="space-y-8">
      <header>
        <h1 className="admin-h1">Mensajes</h1>
        <p className="mt-2 text-sm text-washed-black/60">
          Lo que escriben los clientes en el formulario de contacto. Cada mensaje llega también por email: si respondes a ese email, le contestas directamente al cliente.
        </p>
      </header>

      <nav aria-label="Filtrar mensajes" className="flex gap-1">
        {[
          { href: '/admin/mensajes', label: `Pendientes (${pending})`, active: !showAll },
          { href: '/admin/mensajes?ver=todos', label: 'Todos', active: showAll },
        ].map((f) => (
          <Link
            key={f.href}
            href={f.href}
            aria-current={f.active ? 'page' : undefined}
            className={`px-3 py-1.5 text-[11px] uppercase tracking-[0.15em] ${f.active ? 'bg-washed-black text-offwhite' : 'bg-washed-black/5 hover:bg-washed-black/10'}`}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      <ul className="space-y-4">
        {messages.map((m) => (
          <li key={m.id} className={`admin-card space-y-3 ${m.handled ? 'opacity-60' : ''}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm">
                <strong className="font-medium">{m.name}</strong> · <span className="text-washed-black/70">{m.email}</span>
                {m.orderNumber && (
                  <>
                    {' · '}
                    {orderId.get(m.orderNumber) ? (
                      <Link href={`/admin/pedidos/${orderId.get(m.orderNumber)}`} className="underline underline-offset-4">
                        {m.orderNumber}
                      </Link>
                    ) : (
                      <span title="No existe ningún pedido con ese número">{m.orderNumber} (no encontrado)</span>
                    )}
                  </>
                )}
              </p>
              <time className="text-xs text-washed-black/55" dateTime={m.createdAt.toISOString()}>
                {dateFmt.format(m.createdAt)}
              </time>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-6">{m.message}</p>
            <div className="flex flex-wrap gap-2">
              <a href={`mailto:${m.email}?subject=${encodeURIComponent('Re: tu mensaje a KAEO')}`} className="btn-secondary btn-sm">
                Responder
              </a>
              <form action={setHandled.bind(null, m.id, !m.handled)}>
                <button className="btn-secondary btn-sm">{m.handled ? 'Marcar como pendiente' : 'Marcar como atendido'}</button>
              </form>
            </div>
          </li>
        ))}
        {messages.length === 0 && <li className="admin-card py-10 text-center text-sm text-washed-black/60">{showAll ? 'Todavía no hay mensajes.' : 'No hay mensajes pendientes.'}</li>}
      </ul>
    </div>
  )
}

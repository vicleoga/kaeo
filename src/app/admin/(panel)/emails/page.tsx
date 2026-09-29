import Link from 'next/link'
import { prisma } from '@/server/db'
import { getCurrentAdmin } from '@/server/auth'
import { getCompany } from '@/server/settings'
import { EMAIL_KIND_LABEL, EMAIL_STATUS } from './labels'
import TestEmailForm from './TestEmailForm'

export const metadata = { title: 'Emails' }

const dateFmt = new Intl.DateTimeFormat('es-ES', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Madrid' })
const FILTERS = [
  { key: '', label: 'Todos' },
  { key: 'FAILED', label: 'Fallidos' },
  { key: 'SENT', label: 'Enviados' },
  { key: 'LOGGED', label: 'No enviados (log)' },
] as const

export default async function EmailsPage({ searchParams }: { searchParams: Promise<{ estado?: string; q?: string }> }) {
  const { estado = '', q = '' } = await searchParams
  const status = FILTERS.some((f) => f.key && f.key === estado) ? (estado as 'FAILED' | 'SENT' | 'LOGGED') : undefined
  const [emails, failed, admin, company] = await Promise.all([
    prisma.emailLog.findMany({
      where: { ...(status ? { status } : {}), ...(q ? { OR: [{ to: { contains: q, mode: 'insensitive' } }, { subject: { contains: q, mode: 'insensitive' } }] } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: { id: true, kind: true, to: true, subject: true, status: true, error: true, createdAt: true, order: { select: { id: true, number: true } } },
    }),
    prisma.emailLog.count({ where: { status: 'FAILED' } }),
    getCurrentAdmin(),
    getCompany(),
  ])
  const provider = process.env.EMAIL_PROVIDER || 'log'

  return (
    <div className="space-y-8">
      <header>
        <h1 className="admin-h1">Emails</h1>
        <p className="mt-2 text-sm text-washed-black/60">Todos los emails que envía la tienda: a clientes y avisos internos. Puedes ver cada uno tal cual lo recibe el cliente y reenviarlo.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="admin-card space-y-2 text-sm">
          <h2 className="admin-h2">Configuración</h2>
          {provider === 'smtp' ? (
            <p>
              Envío <strong>activo</strong> por SMTP ({process.env.SMTP_HOST}) desde <strong>{process.env.EMAIL_FROM || process.env.SMTP_USER}</strong>.
            </p>
          ) : (
            <p>
              Modo <strong>log</strong>: los emails se registran aquí pero <strong>no salen</strong> de la tienda. Para enviarlos de verdad, configura
              <code className="mx-1">EMAIL_PROVIDER=smtp</code>en el servidor (ver README).
            </p>
          )}
          <p className="text-washed-black/65">
            Avisos internos a: <strong>{process.env.EMAIL_ADMIN || company.email || process.env.SMTP_USER || 'sin configurar'}</strong>
          </p>
        </section>
        <TestEmailForm defaultTo={admin?.email ?? process.env.EMAIL_ADMIN ?? ''} />
      </div>

      {failed > 0 && (
        <p className="alert-error" role="alert">
          {failed} {failed === 1 ? 'email ha fallado' : 'emails han fallado'}. Ábrelos para ver el motivo y reenviarlos.
        </p>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <nav aria-label="Filtrar por estado" className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <Link
              key={f.key}
              href={f.key ? `/admin/emails?estado=${f.key}` : '/admin/emails'}
              aria-current={estado === f.key ? 'page' : undefined}
              className={`px-3 py-1.5 text-[11px] uppercase tracking-[0.15em] ${estado === f.key ? 'bg-washed-black text-offwhite' : 'bg-washed-black/5 hover:bg-washed-black/10'}`}
            >
              {f.label}
            </Link>
          ))}
        </nav>
        <form className="flex items-end gap-2" role="search">
          {estado && <input type="hidden" name="estado" value={estado} />}
          <label htmlFor="q" className="sr-only">
            Buscar
          </label>
          <input id="q" name="q" defaultValue={q} placeholder="Destinatario o asunto" className="input w-64 py-2" />
          <button className="btn-secondary py-2">Buscar</button>
        </form>
      </div>

      <div className="overflow-x-auto">
        <table className="admin-table min-w-[820px]">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Para</th>
              <th>Asunto</th>
              <th>Pedido</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {emails.map((e) => (
              <tr key={e.id}>
                <td className="whitespace-nowrap text-xs text-washed-black/70">{dateFmt.format(e.createdAt)}</td>
                <td className="text-xs">{EMAIL_KIND_LABEL[e.kind] ?? e.kind}</td>
                <td className="text-xs">{e.to}</td>
                <td>
                  <Link href={`/admin/emails/${e.id}`} className="hover:underline">
                    {e.subject}
                  </Link>
                </td>
                <td className="text-xs">
                  {e.order ? (
                    <Link href={`/admin/pedidos/${e.order.id}`} className="hover:underline">
                      {e.order.number}
                    </Link>
                  ) : (
                    '—'
                  )}
                </td>
                <td>
                  <span className={`badge ${EMAIL_STATUS[e.status].className}`} title={e.error ?? undefined}>
                    {EMAIL_STATUS[e.status].label}
                  </span>
                </td>
              </tr>
            ))}
            {emails.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-washed-black/60">
                  No hay emails{status || q ? ' con estos filtros' : ' todavía'}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

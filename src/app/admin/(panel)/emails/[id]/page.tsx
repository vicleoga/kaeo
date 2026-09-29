import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/server/db'
import { EMAIL_KIND_LABEL, EMAIL_STATUS } from '../labels'
import { resend } from '../actions'

export const metadata = { title: 'Email' }

const dateFmt = new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Madrid' })

export default async function EmailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const email = await prisma.emailLog.findUnique({ where: { id }, include: { order: { select: { id: true, number: true } } } })
  if (!email) notFound()
  const st = EMAIL_STATUS[email.status]

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Link href="/admin/emails" className="text-xs text-washed-black/60 hover:underline">
          ← Emails
        </Link>
        <h1 className="admin-h1">{email.subject}</h1>
      </header>

      <section className="admin-card">
        <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="field-label">Para</dt>
            <dd>{email.to}</dd>
          </div>
          <div>
            <dt className="field-label">Tipo</dt>
            <dd>{EMAIL_KIND_LABEL[email.kind] ?? email.kind}</dd>
          </div>
          <div>
            <dt className="field-label">Fecha</dt>
            <dd>{dateFmt.format(email.createdAt)}</dd>
          </div>
          <div>
            <dt className="field-label">Estado</dt>
            <dd>
              <span className={`badge ${st.className}`}>{st.label}</span> <span className="text-xs text-washed-black/55">vía {email.provider}</span>
            </dd>
          </div>
          {email.replyTo && (
            <div>
              <dt className="field-label">Responder a</dt>
              <dd>{email.replyTo}</dd>
            </div>
          )}
          {email.order && (
            <div>
              <dt className="field-label">Pedido</dt>
              <dd>
                <Link href={`/admin/pedidos/${email.order.id}`} className="underline underline-offset-4">
                  {email.order.number}
                </Link>
              </dd>
            </div>
          )}
        </dl>
        {email.error && (
          <p className="alert-error mt-5" role="alert">
            Error: {email.error}
          </p>
        )}
        <form action={resend.bind(null, email.id)} className="mt-5">
          <button className="btn-secondary">Reenviar este email</button>
        </form>
      </section>

      <section className="admin-card space-y-3">
        <h2 className="admin-h2">Así lo ve el cliente</h2>
        {/* sandbox sin permisos: el HTML no puede ejecutar nada ni navegar esta página */}
        <iframe title={`Vista previa: ${email.subject}`} srcDoc={email.html} sandbox="" className="h-[720px] w-full border border-washed-black/10 bg-white" />
        <details>
          <summary className="cursor-pointer text-xs uppercase tracking-[0.15em] text-washed-black/60">Versión de texto</summary>
          <pre className="mt-3 whitespace-pre-wrap bg-washed-black/[0.03] p-4 font-sans text-sm leading-6">{email.text}</pre>
        </details>
      </section>
    </div>
  )
}

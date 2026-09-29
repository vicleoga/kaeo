'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { sendContact, type ContactState } from './actions'

export default function ContactForm() {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendContact, {})
  const err = (k: string) => state.fields?.[k]
  const aria = (k: string) => ({ 'aria-invalid': !!err(k), 'aria-describedby': err(k) ? `${k}-error` : undefined })
  const v = state.values ?? {}

  if (state.ok)
    return (
      <div className="border border-washed-black/15 px-6 py-10 text-center" role="status">
        <p className="heading text-sm">Mensaje enviado</p>
        <span className="divider mx-auto mt-5" aria-hidden="true" />
        <p className="mt-5 text-sm leading-7 text-washed-black/70">Gracias por escribirnos. Te responderemos al email que nos has dejado, normalmente en uno o dos días laborables.</p>
      </div>
    )

  return (
    <form action={action} className="space-y-6" noValidate>
      {state.error && (
        <p className="alert-error" role="alert">
          {state.error}
        </p>
      )}
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="field-label">
            Nombre
          </label>
          <input id="name" name="name" required maxLength={100} autoComplete="name" defaultValue={v.name} className="input" {...aria('name')} />
          {err('name') && (
            <p id="name-error" className="field-error">
              {err('name')}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="email" className="field-label">
            Email
          </label>
          <input id="email" name="email" type="email" required maxLength={200} autoComplete="email" defaultValue={v.email} className="input" {...aria('email')} />
          {err('email') && (
            <p id="email-error" className="field-error">
              {err('email')}
            </p>
          )}
        </div>
      </div>
      <div>
        <label htmlFor="orderNumber" className="field-label">
          Número de pedido (opcional)
        </label>
        <input id="orderNumber" name="orderNumber" maxLength={40} placeholder="KAEO-26-000123" autoComplete="off" defaultValue={v.orderNumber} className="input uppercase" />
      </div>
      <div>
        <label htmlFor="message" className="field-label">
          Mensaje
        </label>
        <textarea id="message" name="message" required rows={6} maxLength={4000} defaultValue={v.message} className="input resize-y" {...aria('message')} />
        {err('message') && (
          <p id="message-error" className="field-error">
            {err('message')}
          </p>
        )}
      </div>
      {/* Trampa para bots: oculta para las personas y para los lectores de pantalla */}
      <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="website">No rellenes este campo</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <label className="flex items-start gap-3 text-sm leading-6">
        <input type="checkbox" name="acceptPrivacy" required className="mt-1 h-4 w-4 accent-washed-black" {...aria('acceptPrivacy')} />
        <span>
          He leído la{' '}
          <Link href="/legal/privacidad" target="_blank" className="underline underline-offset-4">
            política de privacidad
          </Link>
          . Usaremos tus datos solo para responderte.
        </span>
      </label>
      {err('acceptPrivacy') && (
        <p id="acceptPrivacy-error" className="field-error">
          {err('acceptPrivacy')}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn-dark w-full sm:w-auto">
        {pending ? 'Enviando…' : 'Enviar mensaje'}
      </button>
    </form>
  )
}

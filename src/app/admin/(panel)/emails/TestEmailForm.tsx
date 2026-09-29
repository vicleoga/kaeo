'use client'

import { useActionState } from 'react'
import { sendTest, type EmailActionState } from './actions'

export default function TestEmailForm({ defaultTo }: { defaultTo: string }) {
  const [state, action, pending] = useActionState<EmailActionState, FormData>(sendTest, {})
  return (
    <form action={action} className="admin-card space-y-4" noValidate>
      <div>
        <h2 className="admin-h2">Email de prueba</h2>
        <p className="field-hint">Para comprobar que la configuración de correo funciona.</p>
      </div>
      {state.error && (
        <p className="alert-error" role="alert">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="alert-ok" role="status">
          {state.ok}
        </p>
      )}
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1">
          <label htmlFor="test-to" className="field-label">
            Enviar a
          </label>
          <input id="test-to" name="to" type="email" defaultValue={defaultTo} className="input" />
        </div>
        <button className="btn-primary py-2.5" disabled={pending}>
          {pending ? 'Enviando…' : 'Enviar prueba'}
        </button>
      </div>
    </form>
  )
}

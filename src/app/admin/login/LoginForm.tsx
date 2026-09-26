'use client'

import { useActionState } from 'react'
import { login, type LoginState } from '../actions'

export default function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {})
  return (
    <form action={action} className="space-y-6" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      {state.error && (
        <p className="alert-error" role="alert">
          {state.error}
        </p>
      )}
      <div>
        <label htmlFor="email" className="field-label">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="username" required className="input" />
      </div>
      <div>
        <label htmlFor="password" className="field-label">
          Contraseña
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
      </div>
      <button type="submit" disabled={pending} className="btn-primary w-full py-3">
        {pending ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  )
}

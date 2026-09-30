'use client'

import { useActionState } from 'react'
import { trackOrder, type TrackState } from './actions'

export default function TrackForm() {
  const [state, action, pending] = useActionState<TrackState, FormData>(trackOrder, {})
  return (
    <form action={action} className="space-y-6" noValidate>
      {state.error && (
        <p className="alert-error" role="alert">
          {state.error}
        </p>
      )}
      <div>
        <label htmlFor="number" className="field-label">
          Número de pedido
        </label>
        <input id="number" name="number" required placeholder="KAEO-26-000123" defaultValue={state.number} className="input uppercase" autoComplete="off" />
      </div>
      <div>
        <label htmlFor="email" className="field-label">
          Email
        </label>
        <input id="email" name="email" type="email" required defaultValue={state.email} className="input" autoComplete="email" />
      </div>
      <button type="submit" disabled={pending} className="btn-dark w-full">
        {pending ? 'Buscando…' : 'Ver mi pedido'}
      </button>
    </form>
  )
}

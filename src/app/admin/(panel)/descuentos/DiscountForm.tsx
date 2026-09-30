'use client'

import { useActionState, useState } from 'react'
import { saveDiscount, type DiscountFormState } from './actions'

export interface DiscountValues {
  code: string
  type: 'PERCENT' | 'AMOUNT'
  value: string
  minSubtotal: string
  startsAt: string
  expiresAt: string
  maxUses: string
  active: boolean
  description: string
}

const EMPTY: DiscountValues = { code: '', type: 'PERCENT', value: '', minSubtotal: '', startsAt: '', expiresAt: '', maxUses: '', active: true, description: '' }

export default function DiscountForm({ id = null, initial = EMPTY }: { id?: string | null; initial?: DiscountValues }) {
  const [state, action, pending] = useActionState<DiscountFormState, FormData>(saveDiscount.bind(null, id), {})
  const [type, setType] = useState(initial.type)
  const err = state.fields ?? {}
  const E = ({ k }: { k: string }) => (err[k] ? <p className="field-error">{err[k]}</p> : null)

  return (
    <form action={action} className="admin-card space-y-5" noValidate>
      <h2 className="admin-h2">{id ? 'Editar código' : 'Nuevo código'}</h2>
      {state.error && <p className="alert-error">{state.error}</p>}
      {state.ok && <p className="alert-ok">{state.ok}</p>}
      <div className="grid gap-5 md:grid-cols-3">
        <div>
          <label htmlFor="code" className="field-label">
            Código
          </label>
          <input id="code" name="code" defaultValue={initial.code} required className="input uppercase" placeholder="VERANO15" aria-invalid={!!err.code} />
          <E k="code" />
        </div>
        <div>
          <label htmlFor="type" className="field-label">
            Tipo
          </label>
          <select id="type" name="type" value={type} onChange={(e) => setType(e.target.value as DiscountValues['type'])} className="input">
            <option value="PERCENT">Porcentaje</option>
            <option value="AMOUNT">Importe fijo</option>
          </select>
        </div>
        <div>
          <label htmlFor="value" className="field-label">
            {type === 'PERCENT' ? 'Descuento (%)' : 'Descuento (€)'}
          </label>
          <input id="value" name="value" defaultValue={initial.value} required inputMode="decimal" className="input" placeholder={type === 'PERCENT' ? '10' : '5,00'} aria-invalid={!!err.value} />
          <E k="value" />
        </div>
        <div>
          <label htmlFor="minSubtotal" className="field-label">
            Pedido mínimo (€)
          </label>
          <input id="minSubtotal" name="minSubtotal" defaultValue={initial.minSubtotal} inputMode="decimal" className="input" placeholder="Opcional" aria-invalid={!!err.minSubtotal} />
          <E k="minSubtotal" />
        </div>
        <div>
          <label htmlFor="startsAt" className="field-label">
            Válido desde
          </label>
          <input id="startsAt" name="startsAt" type="datetime-local" defaultValue={initial.startsAt} className="input" />
        </div>
        <div>
          <label htmlFor="expiresAt" className="field-label">
            Caduca
          </label>
          <input id="expiresAt" name="expiresAt" type="datetime-local" defaultValue={initial.expiresAt} className="input" aria-invalid={!!err.expiresAt} />
          <E k="expiresAt" />
        </div>
        <div>
          <label htmlFor="maxUses" className="field-label">
            Límite de usos
          </label>
          <input id="maxUses" name="maxUses" type="number" min={1} defaultValue={initial.maxUses} className="input" placeholder="Sin límite" aria-invalid={!!err.maxUses} />
          <E k="maxUses" />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="description" className="field-label">
            Descripción interna
          </label>
          <input id="description" name="description" defaultValue={initial.description} maxLength={200} className="input" />
        </div>
      </div>
      <label className="flex items-center gap-3 text-sm">
        <input type="checkbox" name="active" defaultChecked={initial.active} className="h-4 w-4 accent-washed-black" />
        Activo
      </label>
      <button className="btn-primary" disabled={pending}>
        {pending ? 'Guardando…' : id ? 'Guardar cambios' : 'Crear código'}
      </button>
    </form>
  )
}

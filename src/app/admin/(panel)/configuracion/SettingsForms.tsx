'use client'

import { useActionState } from 'react'
import { saveCompany, saveShippingZones, saveVat, type SettingsState } from './actions'

function Feedback({ state }: { state: SettingsState }) {
  if (state.error)
    return (
      <p className="alert-error" role="alert">
        {state.error}
      </p>
    )
  if (state.ok)
    return (
      <p className="alert-ok" role="status">
        {state.ok}
      </p>
    )
  return null
}

export interface ZoneRow {
  id: string
  code: string
  name: string
  active: boolean
  price: string
  freeFrom: string
  days: string
  where: string
}

export function ShippingZonesForm({ zones }: { zones: ZoneRow[] }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(saveShippingZones, {})
  const err = state.fields ?? {}
  return (
    <form action={action} className="admin-card space-y-5" noValidate>
      <div>
        <h2 className="admin-h2">Zonas de envío</h2>
        <p className="field-hint">
          Solo se vende a las zonas activas. Precios con IVA incluido. Envío gratis: vacío = nunca. Canarias y UE están preparadas pero
          desactivadas hasta confirmar la fiscalidad con la gestoría (IGIC / IVA del país de destino).
        </p>
      </div>
      <Feedback state={state} />
      <div className="overflow-x-auto">
        <table className="admin-table min-w-[640px]">
          <thead>
            <tr>
              <th>Zona</th>
              <th className="text-center">Activa</th>
              <th>Precio (€)</th>
              <th>Gratis desde (€)</th>
              <th>Plazo de entrega</th>
            </tr>
          </thead>
          <tbody>
            {zones.map((z) => (
              <tr key={z.id} className={err[z.id] ? 'bg-terracotta/5' : ''}>
                <td>
                  {z.name}
                  <span className="block text-[11px] text-washed-black/55">{z.where}</span>
                </td>
                <td className="text-center">
                  <input type="checkbox" name={`zone.${z.id}.active`} defaultChecked={z.active} className="h-4 w-4 accent-washed-black" aria-label={`${z.name} activa`} />
                </td>
                <td>
                  <input name={`zone.${z.id}.price`} defaultValue={z.price} inputMode="decimal" className="input w-24 py-1.5" aria-label={`Precio de envío ${z.name}`} />
                </td>
                <td>
                  <input name={`zone.${z.id}.freeFrom`} defaultValue={z.freeFrom} inputMode="decimal" placeholder="Nunca" className="input w-28 py-1.5" aria-label={`Envío gratis desde, ${z.name}`} />
                </td>
                <td>
                  <input name={`zone.${z.id}.days`} defaultValue={z.days} maxLength={60} className="input w-44 py-1.5" aria-label={`Plazo de entrega ${z.name}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="btn-primary" disabled={pending}>
        {pending ? 'Guardando…' : 'Guardar zonas'}
      </button>
    </form>
  )
}

export function VatForm({ vat }: { vat: string }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(saveVat, {})
  return (
    <form action={action} className="admin-card space-y-4" noValidate>
      <div>
        <h2 className="admin-h2">IVA general</h2>
        <p className="field-hint">Se aplica a los productos que no tienen un IVA propio. Los precios de la tienda ya lo incluyen.</p>
      </div>
      <Feedback state={state} />
      <div className="flex items-end gap-3">
        <div>
          <label htmlFor="vat" className="field-label">
            IVA (%)
          </label>
          <input id="vat" name="vat" defaultValue={vat} inputMode="decimal" className="input w-28" aria-invalid={!!state.fields?.vat} />
        </div>
        <button className="btn-primary py-2.5" disabled={pending}>
          {pending ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}

export interface CompanyValues {
  legalName: string
  taxId: string
  address: string
  email: string
  phone: string
}

export function CompanyForm({ company }: { company: CompanyValues }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(saveCompany, {})
  const err = state.fields ?? {}
  const field = (name: keyof CompanyValues, label: string, props: Record<string, unknown> = {}) => (
    <div>
      <label htmlFor={`c-${name}`} className="field-label">
        {label}
      </label>
      <input id={`c-${name}`} name={name} defaultValue={company[name]} className="input" aria-invalid={!!err[name]} {...props} />
      {err[name] && <p className="field-error">{err[name]}</p>}
    </div>
  )
  return (
    <form action={action} className="admin-card space-y-4" noValidate>
      <div>
        <h2 className="admin-h2">Datos de la empresa</h2>
        <p className="field-hint">Aparecerán en el aviso legal, en las condiciones de venta y en los emails (fase 5).</p>
      </div>
      <Feedback state={state} />
      <div className="grid gap-4 md:grid-cols-2">
        {field('legalName', 'Razón social', { maxLength: 200 })}
        {field('taxId', 'NIF / CIF', { maxLength: 30 })}
        <div className="md:col-span-2">{field('address', 'Dirección fiscal', { maxLength: 300 })}</div>
        {field('email', 'Email de contacto', { type: 'email', maxLength: 200 })}
        {field('phone', 'Teléfono (opcional)', { type: 'tel', maxLength: 30 })}
      </div>
      <button className="btn-primary" disabled={pending}>
        {pending ? 'Guardando…' : 'Guardar datos'}
      </button>
    </form>
  )
}

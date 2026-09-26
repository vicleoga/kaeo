'use client'

import { useActionState } from 'react'
import { formatCents } from '@/lib/catalog'
import { saveVariants, type FormState } from './actions'

interface VariantRow {
  id: string
  sku: string
  size: string
  color: { name: string; hex: string }
  price: string
  stock: number
  threshold: number
  providerRef: string
  active: boolean
}

interface Props {
  productId: string
  stockMode: 'ON_DEMAND' | 'OWN_STOCK'
  basePrice: number
  variants: VariantRow[]
}

export default function VariantsForm({ productId, stockMode, basePrice, variants }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveVariants.bind(null, productId), {})
  const ownStock = stockMode === 'OWN_STOCK'
  const err = state.fields ?? {}

  return (
    <form action={action} className="admin-card space-y-5" noValidate>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="admin-h2">Variantes ({variants.filter((v) => v.active).length} activas)</h2>
          <p className="field-hint">
            Se generan solas al guardar tallas y colores. Precio vacío = {formatCents(basePrice)}.
            {!ownStock && ' Producto bajo demanda: el stock no se tiene en cuenta.'}
          </p>
        </div>
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? 'Guardando…' : 'Guardar variantes'}
        </button>
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

      <div className="overflow-x-auto">
        <table className="admin-table min-w-[860px]">
          <thead>
            <tr>
              <th>Variante</th>
              <th>SKU</th>
              <th>Precio (€)</th>
              {ownStock && <th>Stock</th>}
              {ownStock && <th>Aviso si ≤</th>}
              <th>Ref. proveedor</th>
              <th className="text-center">Activa</th>
            </tr>
          </thead>
          <tbody>
            {variants.map((v) => {
              const low = ownStock && v.active && v.stock <= v.threshold
              return (
                <tr key={v.id} className={v.active ? '' : 'opacity-50'}>
                  <td className="whitespace-nowrap">
                    <span className="mr-2 inline-block h-3 w-3 rounded-full border border-washed-black/20 align-middle" style={{ backgroundColor: v.color.hex }} />
                    {v.color.name} · <strong className="font-medium">{v.size}</strong>
                  </td>
                  <td>
                    <input
                      name={`v.${v.id}.sku`}
                      defaultValue={v.sku}
                      aria-label={`SKU ${v.color.name} ${v.size}`}
                      className={`input w-40 py-1.5 font-mono text-xs uppercase ${err[v.id] ? 'border-terracotta' : ''}`}
                    />
                  </td>
                  <td>
                    <input
                      name={`v.${v.id}.price`}
                      defaultValue={v.price}
                      placeholder={formatCents(basePrice).replace(/\s?€/, '')}
                      inputMode="decimal"
                      aria-label={`Precio ${v.sku}`}
                      className="input w-24 py-1.5"
                    />
                  </td>
                  {ownStock ? (
                    <>
                      <td>
                        <input
                          name={`v.${v.id}.stock`}
                          type="number"
                          min={0}
                          defaultValue={v.stock}
                          aria-label={`Stock ${v.sku}`}
                          className={`input w-20 py-1.5 tabular-nums ${low ? 'border-terracotta text-terracotta' : ''}`}
                        />
                      </td>
                      <td>
                        <input
                          name={`v.${v.id}.threshold`}
                          type="number"
                          min={0}
                          defaultValue={v.threshold}
                          aria-label={`Aviso de stock ${v.sku}`}
                          className="input w-16 py-1.5 tabular-nums"
                        />
                      </td>
                    </>
                  ) : null}
                  <td>
                    {!ownStock && (
                      <>
                        <input type="hidden" name={`v.${v.id}.stock`} value={v.stock} />
                        <input type="hidden" name={`v.${v.id}.threshold`} value={v.threshold} />
                      </>
                    )}
                    <input
                      name={`v.${v.id}.providerRef`}
                      defaultValue={v.providerRef}
                      aria-label={`Referencia en proveedor ${v.sku}`}
                      className="input w-36 py-1.5 text-xs"
                    />
                  </td>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      name={`v.${v.id}.active`}
                      defaultChecked={v.active}
                      aria-label={`Variante ${v.sku} activa`}
                      className="h-4 w-4 accent-washed-black"
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </form>
  )
}

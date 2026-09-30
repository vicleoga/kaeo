'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { saveStock, type InventoryState } from './actions'

interface Group {
  id: string
  name: string
  status: 'DRAFT' | 'PUBLISHED'
  variants: { id: string; sku: string; size: string; colorName: string; colorHex: string; stock: number; threshold: number }[]
}

export default function InventoryForm({ groups }: { groups: Group[] }) {
  const [state, action, pending] = useActionState<InventoryState, FormData>(saveStock, {})

  return (
    <form action={action} className="space-y-6">
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

      {groups.map((g) => (
        <section key={g.id} className="admin-card">
          <h2 className="admin-h2 flex flex-wrap items-center gap-3">
            <Link href={`/admin/productos/${g.id}`} className="hover:underline">
              {g.name}
            </Link>
            {g.status === 'DRAFT' && <span className="badge bg-washed-black/5 text-washed-black/60">Borrador</span>}
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="admin-table min-w-[520px]">
              <thead>
                <tr>
                  <th>Variante</th>
                  <th>SKU</th>
                  <th className="w-32">Stock</th>
                </tr>
              </thead>
              <tbody>
                {g.variants.map((v) => {
                  const low = v.stock <= v.threshold
                  return (
                    <tr key={v.id}>
                      <td className="whitespace-nowrap">
                        <span className="mr-2 inline-block h-3 w-3 rounded-full border border-washed-black/20 align-middle" style={{ backgroundColor: v.colorHex }} />
                        {v.colorName} · <strong className="font-medium">{v.size}</strong>
                        {low && <span className="badge ml-2 bg-terracotta/15 text-terracotta">{v.stock === 0 ? 'Agotado' : 'Stock bajo'}</span>}
                      </td>
                      <td className="font-mono text-xs">{v.sku}</td>
                      <td>
                        <input type="hidden" name={`orig.${v.id}`} value={v.stock} />
                        <input
                          name={`stock.${v.id}`}
                          type="number"
                          min={0}
                          defaultValue={v.stock}
                          aria-label={`Stock de ${v.sku} (aviso si ≤ ${v.threshold})`}
                          className={`input w-24 py-1.5 tabular-nums ${low ? 'border-terracotta text-terracotta' : ''}`}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <div className="sticky bottom-0 -mx-5 flex justify-end border-t border-washed-black/10 bg-offwhite/95 px-5 py-4 backdrop-blur md:mx-0 md:px-0">
        <button type="submit" disabled={pending} className="btn-primary px-8 py-3">
          {pending ? 'Guardando…' : 'Guardar stock'}
        </button>
      </div>
    </form>
  )
}

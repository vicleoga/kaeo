'use client'

import Form from 'next/form'
import Link from 'next/link'
import { useRef } from 'react'
import type { ColorInfo } from '@/lib/types'

interface Props {
  basePath: string
  colors: ColorInfo[]
  sizes: string[]
  current: { color?: string; talla?: string; orden?: string }
}

// Formulario GET: los filtros viven en la URL (se pueden compartir y funcionan sin JS).
// Con JS, cada cambio envía el formulario y Next navega sin recargar la página.
export default function CatalogFilters({ basePath, colors, sizes, current }: Props) {
  const form = useRef<HTMLFormElement>(null)
  const submit = () => form.current?.requestSubmit()
  const active = !!(current.color || current.talla || (current.orden && current.orden !== 'destacados'))

  return (
    <Form ref={form} action={basePath} className="flex flex-wrap items-end gap-x-6 gap-y-4" aria-label="Filtrar productos">
      <div>
        <label htmlFor="f-color" className="field-label">
          Color
        </label>
        <select id="f-color" name="color" defaultValue={current.color ?? ''} onChange={submit} className="input min-w-[150px] py-2">
          <option value="">Todos</option>
          {colors.map((c) => (
            <option key={c.key} value={c.key}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="f-talla" className="field-label">
          Talla
        </label>
        <select id="f-talla" name="talla" defaultValue={current.talla ?? ''} onChange={submit} className="input min-w-[110px] py-2">
          <option value="">Todas</option>
          {sizes.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="f-orden" className="field-label">
          Ordenar
        </label>
        <select id="f-orden" name="orden" defaultValue={current.orden ?? 'destacados'} onChange={submit} className="input min-w-[170px] py-2">
          <option value="destacados">Destacados</option>
          <option value="novedades">Novedades</option>
          <option value="precio-asc">Precio: de menor a mayor</option>
          <option value="precio-desc">Precio: de mayor a menor</option>
        </select>
      </div>
      <noscript>
        <button type="submit" className="btn-secondary py-2.5">
          Aplicar
        </button>
      </noscript>
      {active && (
        <Link href={basePath} className="pb-2.5 text-[10px] uppercase tracking-[0.22em] text-washed-black/60 underline underline-offset-4 hover:text-washed-black">
          Quitar filtros
        </Link>
      )}
    </Form>
  )
}

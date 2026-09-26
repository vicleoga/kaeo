'use client'

import { useActionState, type ReactNode } from 'react'
import { saveProduct, type FormState } from './actions'

export interface ProductFormValues {
  name: string
  slug: string
  category: 'HOMBRE' | 'MUJER'
  status: 'DRAFT' | 'PUBLISHED'
  stockMode: 'ON_DEMAND' | 'OWN_STOCK'
  price: string
  vatRate: string
  description: string
  composition: string
  care: string
  sizes: string
  colorIds: string[]
  sizeGuide: string
  providerRef: string
  seoTitle: string
  seoDescription: string
  showOnHome: boolean
  sortOrder: number
}

const EMPTY: ProductFormValues = {
  name: '',
  slug: '',
  category: 'HOMBRE',
  status: 'DRAFT',
  stockMode: 'ON_DEMAND',
  price: '',
  vatRate: '',
  description: '',
  composition: '',
  care: '',
  sizes: 'XS, S, M, L, XL',
  colorIds: [],
  sizeGuide: '',
  providerRef: '',
  seoTitle: '',
  seoDescription: '',
  showOnHome: true,
  sortOrder: 0,
}

function Field({ name, label, hint, error, children }: { name: string; label: string; hint?: ReactNode; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={name} className="field-label">
        {label}
      </label>
      {children}
      {error ? (
        <p className="field-error" id={`${name}-error`}>
          {error}
        </p>
      ) : (
        hint && <p className="field-hint">{hint}</p>
      )}
    </div>
  )
}

interface Props {
  productId: string | null
  colors: { id: string; name: string; hex: string }[]
  initial?: ProductFormValues
}

export default function ProductForm({ productId, colors, initial = EMPTY }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveProduct.bind(null, productId), {})
  const err = state.fields ?? {}
  // Tras un envío con errores, el formulario se rellena con lo que se había escrito.
  const v = (state.values ? { ...initial, ...state.values } : initial) as ProductFormValues

  const invalid = (name: string) => ({ 'aria-invalid': !!err[name], 'aria-describedby': err[name] ? `${name}-error` : undefined })

  return (
    <form action={action} className="space-y-6" noValidate>
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

      <section className="admin-card space-y-5">
        <h2 className="admin-h2">Información básica</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <Field name="name" error={err.name} label="Nombre">
            <input id="name" name="name" defaultValue={v.name} required maxLength={120} className="input" {...invalid('name')} />
          </Field>
          <Field name="slug" error={err.slug} label="URL (slug)" hint="Vacío = se genera a partir del nombre">
            <input id="slug" name="slug" defaultValue={v.slug} maxLength={120} placeholder="linen-shirt-sand" className="input" {...invalid('slug')} />
          </Field>
          <Field name="category" error={err.category} label="Categoría">
            <select id="category" name="category" defaultValue={v.category} className="input">
              <option value="HOMBRE">Hombre</option>
              <option value="MUJER">Mujer</option>
            </select>
          </Field>
          <Field name="status" error={err.status} label="Estado">
            <select id="status" name="status" defaultValue={v.status} className="input">
              <option value="DRAFT">Borrador (no se ve en la tienda)</option>
              <option value="PUBLISHED">Publicado</option>
            </select>
          </Field>
        </div>
      </section>

      <section className="admin-card space-y-5">
        <h2 className="admin-h2">Precio y stock</h2>
        <div className="grid gap-5 md:grid-cols-3">
          <Field name="price" error={err.price} label="Precio (€, IVA incluido)" hint="Cada variante puede tener su propio precio">
            <input id="price" name="price" defaultValue={v.price} inputMode="decimal" placeholder="39,90" className="input" {...invalid('price')} />
          </Field>
          <Field name="vatRate" error={err.vatRate} label="IVA propio (%)" hint="Vacío = el general de la tienda (21 %)">
            <input id="vatRate" name="vatRate" defaultValue={v.vatRate} inputMode="decimal" placeholder="21" className="input" {...invalid('vatRate')} />
          </Field>
          <Field name="stockMode" error={err.stockMode} label="Tipo de stock">
            <select id="stockMode" name="stockMode" defaultValue={v.stockMode} className="input">
              <option value="ON_DEMAND">Bajo demanda (sin límite)</option>
              <option value="OWN_STOCK">Stock propio (por variante)</option>
            </select>
          </Field>
        </div>
      </section>

      <section className="admin-card space-y-5">
        <h2 className="admin-h2">Tallas y colores</h2>
        <Field
          name="sizes"
          label="Tallas de este producto"
          hint="Separadas por comas y en el orden en que se mostrarán (dependen de la prenda del proveedor). Ej.: XS, S, M, L, XL · 36, 38, 40 · Única"
        >
          <input id="sizes" name="sizes" defaultValue={v.sizes} className="input" {...invalid('sizes')} />
        </Field>
        <fieldset>
          <legend className="field-label">Colores</legend>
          <div className="flex flex-wrap gap-3">
            {colors.map((c) => (
              <label key={c.id} className="flex cursor-pointer items-center gap-2 border border-washed-black/15 bg-white/60 px-3 py-2 text-sm has-[:checked]:border-washed-black">
                <input type="checkbox" name="colorIds" value={c.id} defaultChecked={v.colorIds.includes(c.id)} className="accent-washed-black" />
                <span className="h-3.5 w-3.5 rounded-full border border-washed-black/20" style={{ backgroundColor: c.hex }} aria-hidden="true" />
                {c.name}
              </label>
            ))}
          </div>
          {err.colorIds ? <p className="field-error">{err.colorIds}</p> : <p className="field-hint">Se crea una variante por cada talla y color.</p>}
        </fieldset>
        <Field
          name="sizeGuide"
          label="Guía de tallas"
          hint='Una fila por línea, columnas separadas por "|". La primera fila son los títulos. Ej.: Talla | Pecho (cm) | Largo (cm)'
        >
          <textarea id="sizeGuide" name="sizeGuide" defaultValue={v.sizeGuide} rows={7} className="input font-mono text-xs" {...invalid('sizeGuide')} />
        </Field>
      </section>

      <section className="admin-card space-y-5">
        <h2 className="admin-h2">Textos de la ficha</h2>
        <Field name="description" error={err.description} label="Descripción">
          <textarea id="description" name="description" defaultValue={v.description} rows={5} maxLength={5000} className="input" />
        </Field>
        <div className="grid gap-5 md:grid-cols-2">
          <Field name="composition" error={err.composition} label="Composición">
            <textarea id="composition" name="composition" defaultValue={v.composition} rows={3} maxLength={500} className="input" />
          </Field>
          <Field name="care" error={err.care} label="Cuidados">
            <textarea id="care" name="care" defaultValue={v.care} rows={3} maxLength={1000} className="input" />
          </Field>
        </div>
      </section>

      <section className="admin-card space-y-5">
        <h2 className="admin-h2">Producción, SEO y portada</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <Field name="providerRef" error={err.providerRef} label="Referencia en el proveedor de producción" hint="Vacía por ahora; se usará al conectar el proveedor bajo demanda">
            <input id="providerRef" name="providerRef" defaultValue={v.providerRef} maxLength={200} className="input" />
          </Field>
          <Field name="sortOrder" error={err.sortOrder} label="Orden" hint="Menor = aparece antes">
            <input id="sortOrder" name="sortOrder" type="number" min={0} defaultValue={v.sortOrder} className="input" {...invalid('sortOrder')} />
          </Field>
          <Field name="seoTitle" error={err.seoTitle} label="Título SEO" hint="Máx. 70 caracteres. Vacío = nombre del producto">
            <input id="seoTitle" name="seoTitle" defaultValue={v.seoTitle} maxLength={70} className="input" {...invalid('seoTitle')} />
          </Field>
          <Field name="seoDescription" error={err.seoDescription} label="Descripción SEO" hint="Máx. 160 caracteres">
            <input id="seoDescription" name="seoDescription" defaultValue={v.seoDescription} maxLength={160} className="input" {...invalid('seoDescription')} />
          </Field>
        </div>
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" name="showOnHome" defaultChecked={v.showOnHome} className="h-4 w-4 accent-washed-black" />
          Mostrar en la portada
        </label>
      </section>

      <div className="sticky bottom-0 -mx-5 flex justify-end gap-3 border-t border-washed-black/10 bg-offwhite/95 px-5 py-4 backdrop-blur md:mx-0 md:px-0">
        <button type="submit" disabled={pending} className="btn-primary px-8 py-3">
          {pending ? 'Guardando…' : productId ? 'Guardar cambios' : 'Crear producto'}
        </button>
      </div>
    </form>
  )
}

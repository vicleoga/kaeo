'use client'

import { useActionState, useEffect, useState, type ReactNode } from 'react'
import { saveProduct, type FormState } from './actions'
import { formatBytes, prepareImage } from '@/lib/imageResize'

export interface ProductFormValues {
  name: string
  slug: string
  category: 'HOMBRE' | 'MUJER'
  status: 'DRAFT' | 'PUBLISHED'
  stockMode: 'ON_DEMAND' | 'OWN_STOCK'
  price: string
  cost: string
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
  cost: '',
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

/**
 * Fotos en el alta: se eligen aquí y se suben al pulsar "Crear producto".
 * Al elegirlas se reducen en el navegador (fotos de móvil de 5–20 MB → 0,5–2 MB), así la
 * creación del producto no se eterniza ni supera los límites de tamaño.
 */
function NewPhotos({ onPreparing, onCount }: { onPreparing: (busy: boolean) => void; onCount: (n: number) => void }) {
  const [previews, setPreviews] = useState<{ url: string; name: string; before: number; after: number; tooBig: boolean }[]>([])
  const [preparing, setPreparing] = useState(false)
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.url)), [previews])

  const onChange = async (input: HTMLInputElement) => {
    const originals = [...(input.files ?? [])].slice(0, 12)
    setPreparing(true)
    onPreparing(true)
    const ready = await Promise.all(originals.map((f) => prepareImage(f)))
    // Sustituye los ficheros del input por los reducidos: son los que se envían al crear
    const dt = new DataTransfer()
    ready.forEach((f) => dt.items.add(f))
    input.files = dt.files
    setPreviews(ready.map((f, i) => ({ url: URL.createObjectURL(f), name: f.name, before: originals[i].size, after: f.size, tooBig: f.size > 15 * 1024 * 1024 })))
    onCount(ready.length)
    setPreparing(false)
    onPreparing(false)
  }

  return (
    <section className="admin-card space-y-4">
      <div>
        <h2 className="admin-h2">Fotos</h2>
        <p className="field-hint">
          Se suben al crear el producto (la primera será la principal). Después podrás ordenarlas, asignarles un color y escribir su
          texto alternativo.
        </p>
      </div>
      <input
        id="files"
        name="files"
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={(e) => onChange(e.currentTarget)}
        className="block w-full text-sm file:mr-4 file:border file:border-washed-black/40 file:bg-transparent file:px-4 file:py-2 file:text-[10px] file:uppercase file:tracking-[0.2em]"
        aria-describedby="files-hint"
      />
      <p id="files-hint" className="field-hint" aria-live="polite">
        {preparing ? 'Preparando fotos…' : 'JPG, PNG, WebP o AVIF · hasta 12 · se reducen en tu navegador antes de subirlas'}
      </p>
      {previews.length > 0 && (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {previews.map((p, i) => (
            <li key={p.url} className="relative">
              <img src={p.url} alt="" className="aspect-[4/5] w-full object-cover" />
              {i === 0 && <span className="badge absolute left-1 top-1 bg-washed-black text-offwhite">Principal</span>}
              <span className="mt-1 block text-[10px] text-washed-black/55">
                {p.after < p.before ? `${formatBytes(p.before)} → ${formatBytes(p.after)}` : formatBytes(p.after)}
              </span>
              {p.tooBig && <span className="badge absolute inset-x-1 bottom-6 bg-terracotta text-offwhite">Supera 15 MB</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

interface Props {
  productId: string | null
  colors: { id: string; name: string; hex: string }[]
  initial?: ProductFormValues
}

export default function ProductForm({ productId, colors, initial = EMPTY }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveProduct.bind(null, productId), {})
  const [preparingPhotos, setPreparingPhotos] = useState(false)
  const [photoCount, setPhotoCount] = useState(0)
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

      {!productId && <NewPhotos onPreparing={setPreparingPhotos} onCount={setPhotoCount} />}

      <section className="admin-card space-y-5">
        <h2 className="admin-h2">Precio, coste y stock</h2>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <Field name="price" error={err.price} label="Precio (€, IVA incluido)" hint="Cada variante puede tener su propio precio">
            <input id="price" name="price" defaultValue={v.price} inputMode="decimal" placeholder="39,90" className="input" {...invalid('price')} />
          </Field>
          <Field
            name="cost"
            error={err.cost}
            label="Coste por unidad (€, sin IVA)"
            hint="Lo que te cobra el proveedor por prenda. Sirve para calcular el beneficio real"
          >
            <input id="cost" name="cost" defaultValue={v.cost} inputMode="decimal" placeholder="9,50" className="input" {...invalid('cost')} />
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
        <button type="submit" disabled={pending || preparingPhotos} className="btn-primary px-8 py-3">
          {preparingPhotos
            ? 'Preparando fotos…'
            : pending
              ? !productId && photoCount
                ? `Creando producto y subiendo ${photoCount} foto${photoCount === 1 ? '' : 's'}…`
                : 'Guardando…'
              : productId
                ? 'Guardar cambios'
                : 'Crear producto'}
        </button>
      </div>
    </form>
  )
}

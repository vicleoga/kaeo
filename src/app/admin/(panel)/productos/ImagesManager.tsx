'use client'

import { useActionState, useTransition } from 'react'
import { deleteImage, moveImage, updateImage, type FormState } from './actions'
import PhotoUploader from './PhotoUploader'

interface ImageRow {
  id: string
  url: string
  alt: string
  colorId: string | null
}

interface Props {
  productId: string
  colors: { id: string; name: string }[]
  images: ImageRow[]
}

function ColorSelect({ colors, defaultValue, id }: { colors: Props['colors']; defaultValue?: string | null; id: string }) {
  return (
    <select id={id} name="colorId" defaultValue={defaultValue ?? ''} className="input py-1.5 text-xs">
      <option value="">Todos los colores</option>
      {colors.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  )
}

function ImageCard({ image, index, total, colors }: { image: ImageRow; index: number; total: number; colors: Props['colors'] }) {
  const [state, action, saving] = useActionState<FormState, FormData>(updateImage.bind(null, image.id), {})
  const [busy, start] = useTransition()
  const missingAlt = !image.alt

  return (
    <li className={`border bg-white/60 ${missingAlt ? 'border-terracotta/50' : 'border-washed-black/10'} ${busy ? 'opacity-50' : ''}`}>
      <div className="relative aspect-[4/5] overflow-hidden bg-sand/30">
        <img src={image.url} alt={image.alt} className="h-full w-full object-cover" />
        {index === 0 && <span className="badge absolute left-2 top-2 bg-washed-black text-offwhite">Principal</span>}
      </div>
      <form action={action} className="space-y-2 p-3">
        <label htmlFor={`alt-${image.id}`} className="field-label mb-1">
          Texto alternativo {missingAlt && <span className="text-terracotta">· falta</span>}
        </label>
        <textarea
          id={`alt-${image.id}`}
          name="alt"
          defaultValue={image.alt}
          rows={2}
          maxLength={300}
          placeholder="Describe la foto para lectores de pantalla"
          className="input py-1.5 text-xs"
        />
        <label htmlFor={`color-${image.id}`} className="sr-only">
          Color de la foto
        </label>
        <ColorSelect colors={colors} defaultValue={image.colorId} id={`color-${image.id}`} />
        <div className="flex items-center justify-between gap-2 pt-1">
          <button type="submit" disabled={saving} className="btn-secondary px-3 py-1.5">
            {saving ? '…' : state.ok ? 'Guardado ✓' : 'Guardar'}
          </button>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={index === 0 || busy}
              onClick={() => start(() => moveImage(image.id, 'up'))}
              className="btn-secondary px-2.5 py-1.5"
              aria-label="Mover antes"
            >
              ←
            </button>
            <button
              type="button"
              disabled={index === total - 1 || busy}
              onClick={() => start(() => moveImage(image.id, 'down'))}
              className="btn-secondary px-2.5 py-1.5"
              aria-label="Mover después"
            >
              →
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => confirm('¿Borrar esta foto?') && start(() => deleteImage(image.id))}
              className="btn-danger px-2.5 py-1.5"
              aria-label="Borrar foto"
            >
              ✕
            </button>
          </div>
        </div>
      </form>
    </li>
  )
}

export default function ImagesManager({ productId, colors, images }: Props) {
  return (
    <section className="admin-card space-y-5">
      <div>
        <h2 className="admin-h2">Fotos ({images.length})</h2>
        <p className="field-hint">
          La primera es la principal. Si una foto es de un color concreto, asígnalo: la ficha la mostrará al elegir ese color.
          Se convierten a WebP y se eliminan los datos EXIF (GPS, cámara…).
        </p>
      </div>

      {images.length > 0 ? (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img, i) => (
            <ImageCard key={img.id} image={img} index={i} total={images.length} colors={colors} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-washed-black/60">Este producto aún no tiene fotos.</p>
      )}

      <PhotoUploader productId={productId} colors={colors} />
    </section>
  )
}

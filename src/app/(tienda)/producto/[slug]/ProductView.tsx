'use client'

import { useRef, useState } from 'react'
import type { ProductDetail } from '@/lib/types'
import { formatCents } from '@/lib/catalog'
import { toCartLine } from '@/lib/cartLine'
import { useCart } from '@/context/CartContext'
import { CloseIcon } from '@/components/Icons'

export default function ProductView({ product }: { product: ProductDetail }) {
  const { add } = useCart()
  const [color, setColor] = useState(product.colors[0])
  const [size, setSize] = useState<string | null>(null)
  const [imageIndex, setImageIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const guideRef = useRef<HTMLDialogElement>(null)

  // Fotos del color elegido (+ las que valen para todos los colores); si no hay, todas.
  const ofColor = product.images.filter((i) => i.colorKey === color.key || i.colorKey === null)
  const images = ofColor.length ? ofColor : product.images
  const current = images[Math.min(imageIndex, images.length - 1)]

  const variant = size ? product.variants.find((v) => v.colorKey === color.key && v.size === size) : undefined
  const price = variant?.priceCents ?? Math.min(...product.variants.filter((v) => v.colorKey === color.key).map((v) => v.priceCents))

  const chooseColor = (c: typeof color) => {
    setColor(c)
    setImageIndex(0)
    // Si la talla elegida no existe o no está disponible en el nuevo color, se deselecciona.
    if (size && !product.variants.some((v) => v.colorKey === c.key && v.size === size && v.available)) setSize(null)
  }

  const addToCart = () => {
    if (!variant) {
      setError('Elige una talla.')
      return
    }
    setError(null)
    add(toCartLine(product, variant, color, current?.thumbUrl))
  }

  return (
    <div className="grid gap-10 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-16">
      {/* Galería */}
      <div>
        <div className="aspect-[4/5] overflow-hidden bg-sand/30">
          {current && <img src={current.url} alt={current.alt} className="h-full w-full object-cover" fetchPriority="high" />}
        </div>
        {images.length > 1 && (
          <ul className="mt-3 flex gap-3 overflow-x-auto" aria-label="Fotos del producto">
            {images.map((img, i) => (
              <li key={img.url} className="shrink-0">
                <button
                  onClick={() => setImageIndex(i)}
                  aria-label={`Ver foto ${i + 1} de ${images.length}`}
                  aria-current={i === imageIndex}
                  className={`block border ${i === imageIndex ? 'border-washed-black' : 'border-transparent opacity-70 hover:opacity-100'}`}
                >
                  <img src={img.thumbUrl} alt="" className="h-24 w-20 object-cover" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Compra */}
      <div className="md:sticky md:top-28 md:self-start">
        <p className="label text-washed-black/60">{product.category === 'hombre' ? 'Hombre' : 'Mujer'}</p>
        <h1 className="heading mt-4 text-2xl leading-snug md:text-3xl">{product.name}</h1>
        <p className="mt-4 text-lg tabular-nums">{formatCents(price)}</p>
        <p className="mt-1 text-[11px] text-washed-black/60">IVA incluido</p>

        <fieldset className="mt-10">
          <legend className="label mb-3">
            Color · <span className="text-washed-black/60">{color.name}</span>
          </legend>
          <div className="flex flex-wrap gap-3">
            {product.colors.map((c) => (
              <button
                key={c.key}
                onClick={() => chooseColor(c)}
                aria-label={c.name}
                aria-pressed={c.key === color.key}
                className={`h-8 w-8 rounded-full border transition-shadow ${
                  c.key === color.key ? 'border-washed-black ring-1 ring-washed-black ring-offset-2 ring-offset-offwhite' : 'border-washed-black/25 hover:border-washed-black/60'
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <legend className="label">Talla</legend>
            {product.sizeGuide && (
              <button onClick={() => guideRef.current?.showModal()} className="text-[10px] uppercase tracking-[0.22em] underline underline-offset-4 hover:text-washed-black/70">
                Guía de tallas
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((s) => {
              const v = product.variants.find((x) => x.colorKey === color.key && x.size === s)
              const available = !!v?.available
              return (
                <button
                  key={s}
                  disabled={!available}
                  onClick={() => {
                    setSize(s)
                    setError(null)
                  }}
                  aria-pressed={size === s}
                  aria-label={`Talla ${s}${available ? '' : ' (agotada)'}`}
                  className={`min-w-[3rem] border px-3 py-2.5 text-xs font-medium uppercase tracking-[0.12em] transition-colors disabled:cursor-not-allowed disabled:line-through disabled:opacity-35 ${
                    size === s ? 'border-washed-black bg-washed-black text-offwhite' : 'border-washed-black/30 hover:border-washed-black'
                  }`}
                >
                  {s}
                </button>
              )
            })}
          </div>
          <p className="mt-3 min-h-[1.25rem] text-xs" aria-live="polite">
            {error ? (
              <span className="text-terracotta">{error}</span>
            ) : variant?.lowStock ? (
              <span className="text-terracotta">Últimas {variant.lowStock} unidades</span>
            ) : null}
          </p>
        </fieldset>

        <button
          onClick={addToCart}
          className="mt-4 w-full border border-washed-black bg-washed-black py-4 text-[11px] font-medium uppercase tracking-label text-offwhite transition-colors duration-500 hover:bg-transparent hover:text-washed-black"
        >
          {size ? 'Añadir al carrito' : 'Elige una talla'}
        </button>

        <div className="mt-10 divide-y divide-washed-black/15 border-y border-washed-black/15">
          {product.description && (
            <details className="group py-5" open>
              <summary className="label flex cursor-pointer list-none items-center justify-between">
                Descripción <span className="transition-transform group-open:rotate-45" aria-hidden="true">+</span>
              </summary>
              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-washed-black/80">{product.description}</p>
            </details>
          )}
          {(product.composition || product.care) && (
            <details className="group py-5">
              <summary className="label flex cursor-pointer list-none items-center justify-between">
                Composición y cuidados <span className="transition-transform group-open:rotate-45" aria-hidden="true">+</span>
              </summary>
              {product.composition && <p className="mt-4 text-sm leading-7 text-washed-black/80">{product.composition}</p>}
              {product.care && (
                <ul className="mt-3 space-y-1 text-sm leading-7 text-washed-black/80">
                  {product.care.split('·').map((c) => (
                    <li key={c}>{c.trim()}</li>
                  ))}
                </ul>
              )}
            </details>
          )}
          <details className="group py-5">
            <summary className="label flex cursor-pointer list-none items-center justify-between">
              Envíos y devoluciones <span className="transition-transform group-open:rotate-45" aria-hidden="true">+</span>
            </summary>
            <p className="mt-4 text-sm leading-7 text-washed-black/80">
              Envío a península y Baleares. Tienes 30 días para devolverlo.{' '}
              <a href="/envios-y-devoluciones" className="underline underline-offset-4">
                Más información
              </a>
            </p>
          </details>
        </div>
      </div>

      {product.sizeGuide && (
        <dialog
          ref={guideRef}
          aria-labelledby="guia-titulo"
          className="w-[min(92vw,560px)] bg-offwhite p-0 text-washed-black backdrop:bg-washed-black/50"
          onClick={(e) => e.target === guideRef.current && guideRef.current?.close()}
        >
          <div className="p-6 md:p-8">
            <div className="flex items-center justify-between">
              <h2 id="guia-titulo" className="label">
                Guía de tallas
              </h2>
              <button onClick={() => guideRef.current?.close()} aria-label="Cerrar guía de tallas">
                <CloseIcon />
              </button>
            </div>
            <p className="mt-3 text-xs text-washed-black/60">Medidas de la prenda en plano, en centímetros.</p>
            <div className="mt-5 overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    {product.sizeGuide.columns.map((c) => (
                      <th key={c} scope="col">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {product.sizeGuide.rows.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (j === 0 ? <th key={j} scope="row" className="font-medium">{cell}</th> : <td key={j} className="tabular-nums">{cell}</td>))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </dialog>
      )}
    </div>
  )
}

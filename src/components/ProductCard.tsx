'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import type { ProductSummary } from '@/lib/types'
import { formatCents } from '@/lib/catalog'
import { hasPriceRange, toCartLine } from '@/lib/cartLine'
import { useCart } from '@/context/CartContext'

// Tarjeta de producto. "Añadir" despliega las tallas del color elegido (en escritorio aparece
// al pasar el ratón; en móvil está siempre visible). Foto y nombre llevan a la ficha.
// Si hay varias fotos se pasan con las flechas (o deslizando en el móvil) sin salir del catálogo.
export default function ProductCard({ product }: { product: ProductSummary }) {
  const [color, setColor] = useState(product.colors[0])
  const [picking, setPicking] = useState(false)
  const [photo, setPhoto] = useState(0)
  const touchX = useRef<number | null>(null)
  const { add } = useCart()

  // Fotos del color elegido y después las que no son de un color concreto
  const ofColor = product.thumbs.filter((t) => t.colorKey === color.key)
  const neutral = product.thumbs.filter((t) => !t.colorKey)
  const photos = ofColor.length ? [...ofColor, ...neutral] : [{ url: product.imageByColor[color.key] ?? product.image, alt: product.alt }, ...neutral.filter((t) => t.url !== product.image)]
  const current = photos[photo % photos.length]
  const image = photos[0].url
  const many = photos.length > 1
  const go = (step: number) => setPhoto((i) => (i + step + photos.length) % photos.length)
  const chooseColor = (c: typeof color) => {
    setColor(c)
    setPhoto(0)
  }
  const href = `/producto/${product.slug}`
  const variantsOfColor = product.sizes
    .map((size) => product.variants.find((v) => v.colorKey === color.key && v.size === size))
    .filter((v) => v !== undefined)
  const anyAvailable = variantsOfColor.some((v) => v.available)
  const price = hasPriceRange(product) ? `Desde ${formatCents(product.minPriceCents)}` : formatCents(product.minPriceCents)

  return (
    <article className="group" onMouseLeave={() => setPicking(false)}>
      <div
        className="relative aspect-[4/5] overflow-hidden bg-sand/40"
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current == null || !many) return
          const dx = e.changedTouches[0].clientX - touchX.current
          touchX.current = null
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
        }}
      >
        <Link href={href} tabIndex={-1} aria-hidden="true">
          <img
            src={current.url}
            alt={current.alt}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-105"
          />
        </Link>

        {many && (
          <>
            {(['prev', 'next'] as const).map((dir) => (
              <button
                key={dir}
                type="button"
                onClick={() => go(dir === 'next' ? 1 : -1)}
                aria-label={`${dir === 'next' ? 'Foto siguiente' : 'Foto anterior'} de ${product.name}`}
                className={`absolute top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-offwhite/85 text-washed-black shadow-sm transition-opacity duration-300 hover:bg-offwhite focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100 ${
                  dir === 'next' ? 'right-2' : 'left-2'
                }`}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
                  <path d={dir === 'next' ? 'M4.5 2l4 4-4 4' : 'M7.5 2l-4 4 4 4'} />
                </svg>
              </button>
            ))}
            <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center gap-1.5" aria-hidden="true">
              {photos.map((p, i) => (
                <span key={p.url + i} className={`h-1.5 w-1.5 rounded-full transition-colors ${i === photo % photos.length ? 'bg-washed-black/80' : 'bg-offwhite/80'}`} />
              ))}
            </div>
            <span className="sr-only" aria-live="polite">
              Foto {(photo % photos.length) + 1} de {photos.length}
            </span>
          </>
        )}

        <div
          className={`absolute inset-x-3 bottom-3 transition-all duration-500 md:translate-y-3 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:group-focus-within:translate-y-0 md:group-focus-within:opacity-100 ${
            picking ? '!translate-y-0 !opacity-100' : ''
          }`}
        >
          {picking ? (
            <div className="border border-washed-black bg-offwhite/95 p-2" role="group" aria-label={`Elige talla de ${product.name}`}>
              <p className="label mb-2 text-center text-[9px] text-washed-black/60">Elige talla</p>
              <div className="flex flex-wrap justify-center gap-1">
                {variantsOfColor.map((v) => (
                  <button
                    key={v.id}
                    disabled={!v.available}
                    onClick={() => {
                      add(toCartLine(product, v, color, image))
                      setPicking(false)
                    }}
                    className="min-w-[2.25rem] border border-washed-black/30 px-2 py-1.5 text-[10px] font-medium uppercase tracking-[0.1em] transition-colors hover:bg-washed-black hover:text-offwhite disabled:cursor-not-allowed disabled:line-through disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-washed-black"
                    aria-label={`Añadir ${product.name} ${color.name} talla ${v.size}${v.available ? '' : ' (agotada)'}`}
                  >
                    {v.size}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <button
              onClick={() => setPicking(true)}
              disabled={!anyAvailable}
              className="w-full border border-washed-black bg-offwhite/95 py-3 text-[10px] font-medium uppercase tracking-label text-washed-black transition-colors duration-500 hover:bg-washed-black hover:text-offwhite disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-offwhite/95 disabled:hover:text-washed-black"
              aria-label={anyAvailable ? `Añadir ${product.name} en ${color.name}: elegir talla` : `${product.name} en ${color.name}: agotado`}
            >
              {anyAvailable ? 'Añadir' : 'Agotado'}
            </button>
          )}
        </div>
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[11px] font-medium uppercase leading-5 tracking-[0.18em]">
            <Link href={href} className="hover:underline">
              {product.name}
            </Link>
          </h3>
          <p className="mt-1 text-xs text-washed-black/70">{price}</p>
        </div>
        <ul className="flex shrink-0 gap-1.5 pt-1" aria-label="Colores disponibles">
          {product.colors.map((c) => (
            <li key={c.key}>
              <button
                onClick={() => chooseColor(c)}
                aria-label={`Color ${c.name}`}
                aria-pressed={color.key === c.key}
                className={`block h-3 w-3 rounded-full border transition-shadow ${
                  color.key === c.key ? 'border-washed-black ring-1 ring-washed-black ring-offset-2 ring-offset-offwhite' : 'border-washed-black/25'
                }`}
                style={{ backgroundColor: c.hex }}
              />
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}

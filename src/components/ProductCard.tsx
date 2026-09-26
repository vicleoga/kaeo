'use client'

import { useState } from 'react'
import type { ProductSummary } from '@/lib/types'
import { formatCents } from '@/lib/catalog'
import { useCart } from '@/context/CartContext'

export default function ProductCard({ product }: { product: ProductSummary }) {
  const [color, setColor] = useState(product.colors[0])
  const { add } = useCart()
  const image = product.imageByColor[color.key] ?? product.image

  return (
    <article className="group">
      <div className="relative aspect-[4/5] overflow-hidden bg-sand/40">
        <img
          src={image}
          alt={product.alt}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-105"
        />
        <button
          onClick={() => add(product, color)}
          className="absolute inset-x-3 bottom-3 border border-washed-black bg-offwhite/95 py-3 text-[10px] font-medium uppercase tracking-label text-washed-black transition-all duration-500 hover:bg-washed-black hover:text-offwhite md:translate-y-3 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100"
          aria-label={`Añadir ${product.name} en ${color.name} al carrito`}
        >
          Añadir
        </button>
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[11px] font-medium uppercase tracking-[0.18em] leading-5">{product.name}</h3>
          <p className="mt-1 text-xs text-washed-black/70">{formatCents(product.priceCents)}</p>
        </div>
        <ul className="flex shrink-0 gap-1.5 pt-1" aria-label="Colores disponibles">
          {product.colors.map((c) => (
            <li key={c.key}>
              <button
                onClick={() => setColor(c)}
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

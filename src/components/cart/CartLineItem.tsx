'use client'

import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import { formatCents } from '@/lib/catalog'
import type { CartLine } from '@/lib/types'

export default function CartLineItem({ line, onNavigate, large = false }: { line: CartLine; onNavigate?: () => void; large?: boolean }) {
  const { setQty, remove } = useCart()
  const label = `${line.name}, ${line.color.name}, talla ${line.size}`

  return (
    <li className={`flex gap-4 py-6 ${line.unavailable ? 'opacity-60' : ''}`}>
      <Link href={`/producto/${line.slug}`} onClick={onNavigate} className="shrink-0" tabIndex={-1} aria-hidden="true">
        <img src={line.image} alt="" className={`${large ? 'h-36 w-28' : 'h-28 w-[88px]'} object-cover`} />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/producto/${line.slug}`} onClick={onNavigate} className="text-[11px] font-medium uppercase leading-5 tracking-[0.18em] hover:underline">
            {line.name}
          </Link>
          <button onClick={() => remove(line.variantId)} className="shrink-0 text-[10px] uppercase tracking-[0.2em] text-washed-black/50 hover:text-washed-black" aria-label={`Quitar ${label}`}>
            Quitar
          </button>
        </div>
        <p className="mt-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-washed-black/60">
          <span className="inline-block h-2.5 w-2.5 rounded-full border border-washed-black/20" style={{ backgroundColor: line.color.hex }} aria-hidden="true" />
          {line.color.name} · Talla {line.size}
        </p>
        {line.unavailable ? (
          <p className="mt-auto pt-3 text-xs text-terracotta">No disponible — quítalo para continuar.</p>
        ) : (
          <div className="mt-auto flex items-center justify-between pt-3">
            <div className="flex items-center border border-washed-black/30">
              <button className="px-3 py-1 text-sm" onClick={() => setQty(line.variantId, line.qty - 1)} aria-label={`Quitar una unidad de ${label}`}>
                −
              </button>
              <span className="w-6 text-center text-xs" aria-live="polite" aria-label={`${line.qty} unidades`}>
                {line.qty}
              </span>
              <button
                className="px-3 py-1 text-sm disabled:opacity-30"
                onClick={() => setQty(line.variantId, line.qty + 1)}
                disabled={line.qty >= line.maxQty}
                aria-label={`Añadir una unidad de ${label}`}
              >
                +
              </button>
            </div>
            <p className="text-xs tabular-nums">{formatCents(line.priceCents * line.qty)}</p>
          </div>
        )}
      </div>
    </li>
  )
}

'use client'

import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import { formatCents } from '@/lib/catalog'
import CartLineItem from '@/components/cart/CartLineItem'
import FreeShippingHint from '@/components/cart/FreeShippingHint'

export default function CartPageView({ freeShippingFromCents }: { freeShippingFromCents: number | null }) {
  const { lines, ready, subtotal, count, notice, dismissNotice } = useCart()
  const hasUnavailable = lines.some((l) => l.unavailable)

  if (!ready) return <p className="py-24 text-center text-sm text-washed-black/60">Cargando tu carrito…</p>

  if (lines.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="heading text-xs leading-7 tracking-label text-washed-black/70">
          Nothing here yet
          <br />
          No hurry
        </p>
        <span className="divider mx-auto mt-6" aria-hidden="true" />
        <div className="mt-10 flex justify-center gap-3">
          <Link href="/hombre" className="btn-dark">
            Hombre
          </Link>
          <Link href="/mujer" className="btn-dark">
            Mujer
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div>
        {notice && (
          <div className="alert-error mb-4 flex items-start justify-between gap-3 text-xs" role="status">
            <span>{notice}</span>
            <button onClick={dismissNotice} aria-label="Cerrar aviso">
              ✕
            </button>
          </div>
        )}
        <ul className="divide-y divide-washed-black/10 border-y border-washed-black/10">
          {lines.map((l) => (
            <CartLineItem key={l.variantId} line={l} large />
          ))}
        </ul>
      </div>
      <aside className="admin-card h-fit space-y-5 lg:sticky lg:top-28" aria-label="Resumen">
        <h2 className="label">Resumen</h2>
        <div className="flex justify-between text-sm">
          <span>Subtotal ({count} {count === 1 ? 'artículo' : 'artículos'})</span>
          <span className="tabular-nums">{formatCents(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-washed-black/60">
          <span>Envío</span>
          <span>Se calcula en el checkout</span>
        </div>
        <FreeShippingHint subtotal={subtotal} freeFromCents={freeShippingFromCents} />
        {hasUnavailable && <p className="text-xs text-terracotta">Quita los artículos no disponibles para continuar.</p>}
        <Link
          href="/checkout"
          aria-disabled={hasUnavailable}
          className={`block w-full border border-washed-black bg-washed-black py-4 text-center text-[11px] font-medium uppercase tracking-label text-offwhite transition-colors duration-500 hover:bg-transparent hover:text-washed-black ${
            hasUnavailable ? 'pointer-events-none opacity-40' : ''
          }`}
        >
          Finalizar compra
        </Link>
        <p className="text-center text-[11px] text-washed-black/55">Pago seguro · Devoluciones en 30 días</p>
      </aside>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { useCart } from '@/context/CartContext'
import { formatCents } from '@/lib/catalog'
import { CloseIcon } from './Icons'
import CartLineItem from './cart/CartLineItem'
import FreeShippingHint from './cart/FreeShippingHint'

export default function CartDrawer({ freeShippingFromCents }: { freeShippingFromCents: number | null }) {
  const { lines, open, setOpen, subtotal, count, notice, dismissNotice } = useCart()
  const closeRef = useRef<HTMLButtonElement>(null)
  const hasUnavailable = lines.some((l) => l.unavailable)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = open ? 'hidden' : ''
    if (open) closeRef.current?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  const close = () => setOpen(false)

  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open} inert={!open}>
      <div className={`absolute inset-0 bg-washed-black/40 transition-opacity duration-500 ${open ? 'opacity-100' : 'opacity-0'}`} onClick={close} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Carrito"
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-offwhite transition-transform duration-500 ease-[cubic-bezier(.2,.7,.2,1)] ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="flex items-center justify-between border-b border-washed-black/10 px-6 py-6">
          <h2 className="label">Tu carrito ({count})</h2>
          <button ref={closeRef} onClick={close} aria-label="Cerrar carrito" className="p-1">
            <CloseIcon />
          </button>
        </header>

        {notice && (
          <div className="alert-error mx-6 mt-4 flex items-start justify-between gap-3 text-xs" role="status">
            <span>{notice}</span>
            <button onClick={dismissNotice} aria-label="Cerrar aviso" className="shrink-0">
              ✕
            </button>
          </div>
        )}

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <p className="heading text-xs leading-7 tracking-label text-washed-black/70">
              Nothing here yet
              <br />
              No hurry
            </p>
            <span className="divider mt-6" aria-hidden="true" />
            <div className="mt-10 flex gap-3">
              <Link href="/hombre" onClick={close} className="btn-dark">
                Hombre
              </Link>
              <Link href="/mujer" onClick={close} className="btn-dark">
                Mujer
              </Link>
            </div>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-washed-black/10 overflow-y-auto px-6">
              {lines.map((line) => (
                <CartLineItem key={line.variantId} line={line} onNavigate={close} />
              ))}
            </ul>
            <footer className="space-y-4 border-t border-washed-black/10 px-6 py-6">
              <div className="flex justify-between text-xs uppercase tracking-[0.2em]">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatCents(subtotal)}</span>
              </div>
              <FreeShippingHint subtotal={subtotal} freeFromCents={freeShippingFromCents} />
              <Link
                href="/checkout"
                onClick={close}
                aria-disabled={hasUnavailable || count === 0}
                className={`block w-full border border-washed-black bg-washed-black py-4 text-center text-[11px] font-medium uppercase tracking-label text-offwhite transition-colors duration-500 hover:bg-transparent hover:text-washed-black ${
                  hasUnavailable || count === 0 ? 'pointer-events-none opacity-40' : ''
                }`}
              >
                Finalizar compra
              </Link>
              <Link href="/carrito" onClick={close} className="block text-center text-[10px] uppercase tracking-[0.22em] text-washed-black/60 hover:text-washed-black">
                Ver carrito
              </Link>
            </footer>
          </>
        )}
      </aside>
    </div>
  )
}

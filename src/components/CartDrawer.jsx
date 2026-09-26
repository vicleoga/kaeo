import { useEffect } from 'react'
import { useCart } from '../context/CartContext.jsx'
import { PALETTE } from '../data/palette.js'
import { asset } from '../lib/asset.js'
import { formatPrice } from './ProductCard.jsx'
import { CloseIcon } from './Icons.jsx'

export default function CartDrawer() {
  const { items, open, setOpen, setQty, total, count } = useCart()

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = open ? 'hidden' : ''
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        className={`absolute inset-0 bg-washed-black/40 transition-opacity duration-500 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={() => setOpen(false)}
      />
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
          <button onClick={() => setOpen(false)} aria-label="Cerrar carrito" className="p-1">
            <CloseIcon />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <p className="heading text-xs leading-7 tracking-label text-washed-black/70">
              Nothing here yet
              <br />
              No hurry
            </p>
            <span className="divider mt-6" aria-hidden="true" />
            <button onClick={() => setOpen(false)} className="btn-dark mt-10">
              Seguir mirando
            </button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-washed-black/10 overflow-y-auto px-6">
              {items.map(({ key, product, color, qty }) => (
                <li key={key} className="flex gap-4 py-6">
                  <img src={asset(product.image)} alt={product.alt} className="h-28 w-[88px] object-cover" />
                  <div className="flex flex-1 flex-col">
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] leading-5">{product.name}</p>
                    <p className="mt-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-washed-black/60">
                      <span className="inline-block h-2.5 w-2.5 rounded-full border border-washed-black/20" style={{ backgroundColor: PALETTE[color].hex }} />
                      {PALETTE[color].name}
                    </p>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center border border-washed-black/30">
                        <button className="px-3 py-1 text-sm" onClick={() => setQty(key, qty - 1)} aria-label="Quitar uno">
                          −
                        </button>
                        <span className="w-6 text-center text-xs" aria-live="polite">
                          {qty}
                        </span>
                        <button className="px-3 py-1 text-sm" onClick={() => setQty(key, qty + 1)} aria-label="Añadir uno">
                          +
                        </button>
                      </div>
                      <p className="text-xs">{formatPrice(product.price * qty)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <footer className="border-t border-washed-black/10 px-6 py-6">
              <div className="flex justify-between text-xs uppercase tracking-[0.2em]">
                <span>Subtotal</span>
                <span>{formatPrice(total)}</span>
              </div>
              <p className="mt-2 text-[11px] text-washed-black/60">Envío gratuito a partir de 80 €. Impuestos incluidos.</p>
              <button
                className="mt-6 w-full border border-washed-black bg-washed-black py-4 text-[11px] font-medium uppercase tracking-label text-offwhite transition-colors duration-500 hover:bg-transparent hover:text-washed-black"
                onClick={() => alert('Esto es una demo: el checkout llegará pronto.')}
              >
                Finalizar compra
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  )
}

'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import { useCart } from '@/context/CartContext'
import { retryPayment } from '../../checkout/actions'

/** Mientras el pago está pendiente, vuelve a pedir la página cada 2 s (máx. ~1 min). */
export function AutoRefresh() {
  const router = useRouter()
  useEffect(() => {
    let n = 0
    const id = setInterval(() => {
      if (++n > 30) clearInterval(id)
      router.refresh()
    }, 2000)
    return () => clearInterval(id)
  }, [router])
  return null
}

/** Pedido pagado: vacía el carrito y olvida la clave del intento de compra. */
export function ClearCartOnSuccess() {
  const { clear, ready } = useCart()
  const done = useRef(false)
  useEffect(() => {
    if (!ready || done.current) return
    done.current = true
    clear()
    try {
      sessionStorage.removeItem('kaeo:checkoutKey')
    } catch {}
  }, [ready, clear])
  return null
}

export function RetryPaymentButton({ number, token }: { number: string; token: string }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  return (
    <div className="mt-8">
      <button
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await retryPayment(number, token)
            if (r.ok) window.location.assign(r.redirectUrl)
            else setError(r.error)
          })
        }
        className="btn-dark"
      >
        {pending ? 'Un momento…' : 'Reintentar el pago'}
      </button>
      {error && <p className="field-error">{error}</p>}
    </div>
  )
}

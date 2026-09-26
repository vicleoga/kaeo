import type { Metadata } from 'next'
import { freeShippingThreshold } from '@/server/shipping'
import CartPageView from './CartPageView'

export const metadata: Metadata = { title: 'Carrito', robots: { index: false } }

export default async function CartPage() {
  return (
    <div className="px-5 pb-28 pt-28 md:px-10 md:pt-36">
      <div className="mx-auto max-w-6xl">
        <h1 className="heading text-2xl md:text-3xl">Tu carrito</h1>
        <span className="divider mt-6" aria-hidden="true" />
        <div className="mt-10">
          <CartPageView freeShippingFromCents={await freeShippingThreshold()} />
        </div>
      </div>
    </div>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { activeCountries } from '@/server/shipping'
import CheckoutForm from './CheckoutForm'

export const metadata: Metadata = { title: 'Finalizar compra', robots: { index: false } }

export default async function CheckoutPage() {
  const countries = await activeCountries()
  return (
    <div className="px-5 pb-28 pt-28 md:px-10 md:pt-36">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="heading text-2xl md:text-3xl">Finalizar compra</h1>
            <span className="divider mt-6" aria-hidden="true" />
          </div>
          <Link href="/carrito" className="text-[10px] uppercase tracking-[0.22em] text-washed-black/60 hover:text-washed-black">
            ← Volver al carrito
          </Link>
        </div>
        <div className="mt-10">
          <CheckoutForm countries={countries} />
        </div>
        <p className="mt-16 flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.22em] text-washed-black/50">
          <Logo size={9} /> Pago seguro · Datos protegidos · Devoluciones en 30 días
        </p>
      </div>
    </div>
  )
}

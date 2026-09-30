import type { Metadata } from 'next'
import TrackForm from './TrackForm'

export const metadata: Metadata = {
  title: 'Seguimiento de pedido',
  description: 'Consulta el estado de tu pedido KAEO con el número de pedido y tu email.',
}

export default function TrackingPage() {
  return (
    <div className="px-5 pb-28 pt-28 md:px-10 md:pt-40">
      <div className="mx-auto max-w-md text-center">
        <p className="label text-washed-black/60">Sin prisa, pero sin perderlo de vista</p>
        <h1 className="heading mt-6 text-2xl md:text-3xl">Seguimiento de pedido</h1>
        <span className="divider mx-auto mt-6" aria-hidden="true" />
        <p className="mt-8 text-sm leading-7 text-washed-black/70">
          Escribe el número de pedido (lo encontrarás en el email de confirmación) y el email con el que compraste.
        </p>
        <div className="mt-10 text-left">
          <TrackForm />
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import Reveal from './Reveal.jsx'

export default function Newsletter() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  // Demo: no se envía a ningún servicio todavía.
  const submit = (e) => {
    e.preventDefault()
    if (email) setSent(true)
  }

  return (
    <section className="bg-washed-blue px-6 py-24 text-offwhite md:py-32">
      <Reveal className="mx-auto max-w-xl text-center">
        <p className="label text-offwhite/70">Newsletter</p>
        <h2 className="heading mt-6 text-2xl md:text-4xl">Join the slow club</h2>
        <p className="mx-auto mt-6 max-w-sm text-sm leading-7 text-offwhite/85">
          Nuevas colecciones, historias desde la costa y un 10% en tu primer pedido. Sin prisas, sin spam.
        </p>
        {sent ? (
          <p className="label mt-12" role="status">
            Gracias — nos vemos pronto, sin prisa.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-12 flex flex-col items-stretch gap-6 sm:flex-row sm:items-end">
            <label htmlFor="email" className="sr-only">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="TU EMAIL"
              className="flex-1 rounded-none border-0 border-b border-offwhite/70 bg-transparent px-0 py-3 text-xs uppercase tracking-label text-offwhite placeholder:text-offwhite/60 focus:border-offwhite focus:outline-none"
            />
            <button type="submit" className="btn-light">
              Suscribirme
            </button>
          </form>
        )}
      </Reveal>
    </section>
  )
}

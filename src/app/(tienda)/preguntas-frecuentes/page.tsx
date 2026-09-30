import type { Metadata } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { RETURN_DAYS } from '@/lib/policies'
import ContentPage from '@/components/content/ContentPage'

export const metadata: Metadata = {
  title: 'Preguntas frecuentes',
  description: 'Tallas, envíos, devoluciones, pagos y cuidado de las prendas KAEO.',
}

const FAQ: { group: string; items: { q: string; a: ReactNode }[] }[] = [
  {
    group: 'Pedidos y pagos',
    items: [
      { q: '¿Necesito una cuenta para comprar?', a: 'No. Solo tu email y la dirección de envío. Te enviamos la confirmación y el seguimiento a ese email.' },
      { q: '¿Cómo puedo pagar?', a: 'Con tarjeta a través de una pasarela de pago segura. Nosotros nunca vemos ni guardamos los datos de tu tarjeta.' },
      {
        q: '¿Dónde está mi pedido?',
        a: (
          <>
            En el email de confirmación tienes un enlace a tu pedido. También puedes consultarlo en <Link href="/seguimiento">seguimiento de pedido</Link> con el número de pedido y tu
            email.
          </>
        ),
      },
      {
        q: '¿Puedo cambiar o cancelar un pedido?',
        a: (
          <>
            Si todavía no ha salido, sí: <Link href="/contacto">escríbenos</Link> cuanto antes con el número de pedido. Si ya ha salido, puedes devolverlo cuando llegue.
          </>
        ),
      },
      { q: '¿Tenéis códigos de descuento?', a: 'A veces. Si tienes uno, escríbelo en el campo "Código de descuento" al finalizar la compra.' },
    ],
  },
  {
    group: 'Envíos y devoluciones',
    items: [
      {
        q: '¿A dónde enviáis y cuánto cuesta?',
        a: (
          <>
            De momento a la España peninsular y a Baleares. Precios, plazos y a partir de qué importe es gratis, en <Link href="/envios-y-devoluciones">envíos y devoluciones</Link>.
          </>
        ),
      },
      {
        q: '¿Puedo devolver un producto?',
        a: (
          <>
            Sí, tienes {RETURN_DAYS} días desde que lo recibes. Te lo contamos paso a paso en <Link href="/envios-y-devoluciones">envíos y devoluciones</Link>.
          </>
        ),
      },
      { q: '¿Y si me queda mal la talla?', a: 'Devuélvela y haz un pedido nuevo con la talla correcta: es lo más rápido.' },
    ],
  },
  {
    group: 'Tallas y prendas',
    items: [
      { q: '¿Cómo sé mi talla?', a: 'Cada producto tiene su guía de tallas con las medidas de la prenda en plano. Compárala con una prenda tuya que te guste cómo te queda.' },
      { q: '¿Cómo son los cortes?', a: 'Nuestras camisetas y sudaderas tienen un corte relajado. Si prefieres un ajuste más justo, elige una talla menos.' },
      {
        q: '¿Cómo cuido mis prendas?',
        a: 'Lávalas a 30 °C del revés, sin lejía, y sécalas a la sombra. El algodón teñido en prenda y el lino ganan suavidad con cada lavado. Cada ficha tiene las instrucciones concretas.',
      },
      {
        q: '¿Por qué algunas prendas tardan más?',
        a: 'Algunas las hacemos bajo pedido: se estampan cuando tú las compras, para no fabricar de más ni acumular stock que acabe sin usarse.',
      },
    ],
  },
]

export default function FaqPage() {
  return (
    <ContentPage
      kicker="Good people, good answers"
      title="Preguntas frecuentes"
      intro={
        <>
          ¿No encuentras lo que buscas? <Link href="/contacto" className="underline underline-offset-4">Escríbenos</Link> y te respondemos.
        </>
      }
    >
      <div className="space-y-14">
        {FAQ.map((g) => (
          <section key={g.group} aria-labelledby={`faq-${g.group}`}>
            <h2 id={`faq-${g.group}`} className="heading mb-4 text-[13px]">
              {g.group}
            </h2>
            <div className="divide-y divide-washed-black/10 border-y border-washed-black/10">
              {g.items.map((item) => (
                <details key={item.q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-sm">
                    {item.q}
                    <span className="shrink-0 transition-transform group-open:rotate-45" aria-hidden="true">
                      +
                    </span>
                  </summary>
                  <div className="prose-kaeo mt-3">
                    <p className="!mb-0">{item.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
    </ContentPage>
  )
}

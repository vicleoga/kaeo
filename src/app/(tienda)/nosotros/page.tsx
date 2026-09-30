import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import Reveal from '@/components/Reveal'

export const metadata: Metadata = {
  title: 'Nosotros',
  description: 'KAEO: básicos mediterráneos para vivir despacio. Pocas prendas, bien hechas, con algodón orgánico y lino europeo.',
}

const VALUES = [
  {
    title: 'Pocas prendas, bien hechas',
    text: 'Preferimos una camiseta que dure muchos veranos a diez que se olviden en un cajón. Algodón orgánico de buen gramaje, lino europeo y costuras pensadas para aguantar.',
  },
  {
    title: 'Hechas cuando las pides',
    text: 'Muchas de nuestras prendas se estampan bajo pedido. Tarda unos días más, pero no fabricamos de más ni acumulamos stock que acabe sin usarse.',
  },
  {
    title: 'Colores de la costa',
    text: 'Off white, arena, salvia, azul lavado y negro desgastado. Tintes suaves y teñido en prenda, para que cada pieza tenga ese aire vivido desde el primer día.',
  },
]

export default function AboutPage() {
  return (
    <>
      <section className="px-6 pb-20 pt-32 text-center md:pb-28 md:pt-44">
        <Reveal className="mx-auto max-w-3xl">
          <p className="label text-washed-black/60">Clothes for a calmer tomorrow</p>
          <h1 className="heading mt-10 text-xl leading-[2.1] sm:text-2xl md:text-[34px] md:leading-[2]">
            Good people
            <br />
            Brighter days
            <br />
            A more human way forward
          </h1>
          <span className="divider mx-auto mt-10" aria-hidden="true" />
        </Reveal>
      </section>

      <section className="grid items-center gap-12 px-6 pb-24 md:grid-cols-2 md:gap-20 md:px-10 md:pb-36">
        <Reveal className="relative aspect-[4/5] w-full overflow-hidden">
          <Image src="/images/galeria/paisaje-same-sun.jpg" alt="Sol de tarde sobre el mar Mediterráneo" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
        </Reveal>
        <Reveal className="mx-auto max-w-md space-y-6 text-sm leading-7 text-washed-black/80">
          <p className="label text-washed-black">Mediterranean state of mind</p>
          <p>
            KAEO nace de las tardes largas junto al mar: sal en el pelo, una camiseta que ya es tuya de tanto usarla y ninguna prisa por llegar a ningún sitio.
          </p>
          <p>
            Hacemos básicos para vivir despacio. Prendas sencillas, cómodas y hechas para durar, con frases que nos recuerdan lo importante: menos prisa, más vida.
          </p>
          <p className="text-washed-black/60">Less hurry. More life.</p>
        </Reveal>
      </section>

      <section className="border-t border-washed-black/10 px-6 py-24 md:px-10 md:py-32">
        <ul className="mx-auto grid max-w-6xl gap-14 md:grid-cols-3 md:gap-10">
          {VALUES.map((v) => (
            <Reveal key={v.title} as="li" className="text-center">
              <h2 className="heading text-[13px]">{v.title}</h2>
              <span className="divider mx-auto mt-5" aria-hidden="true" />
              <p className="mx-auto mt-6 max-w-xs text-sm leading-7 text-washed-black/75">{v.text}</p>
            </Reveal>
          ))}
        </ul>
      </section>

      <section className="px-6 pb-28 text-center md:pb-40">
        <Reveal>
          <p className="heading text-sm leading-[2.2] tracking-label md:text-base">T-shirts for a brighter tomorrow</p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/hombre" className="btn-dark">
              Hombre
            </Link>
            <Link href="/mujer" className="btn-dark">
              Mujer
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  )
}

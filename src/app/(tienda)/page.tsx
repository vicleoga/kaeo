import Hero from '@/components/Hero'
import Manifesto from '@/components/Manifesto'
import CategorySection from '@/components/CategorySection'
import Palette from '@/components/Palette'
import Gallery from '@/components/Gallery'
import Newsletter from '@/components/Newsletter'
import Reveal from '@/components/Reveal'

function Quote({ lines }: { lines: string[] }) {
  return (
    <Reveal className="px-6 py-20 text-center md:py-28">
      <p className="heading text-sm leading-[2.2] tracking-label md:text-base">
        {lines.map((l) => (
          <span key={l} className="block">
            {l}
          </span>
        ))}
      </p>
      <span className="divider mx-auto mt-8" aria-hidden="true" />
    </Reveal>
  )
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <Manifesto />
      <CategorySection
        id="hombre"
        title="Hombre"
        kicker="Men · Summer 01"
        lines={['Good vibes', 'Good flow', 'Better days', 'Slow living']}
        image="/images/hombre-sentado-costa.jpg"
        imageAlt="Hombre de pelo ondulado con gafas de sol y camiseta off white KAEO sentado en la piedra frente a la costa, con la frase manuscrita Good Vibes Further"
      />
      <Quote lines={['Less hurry', 'More life']} />
      <CategorySection
        id="mujer"
        title="Mujer"
        kicker="Women · Summer 01"
        lines={['Good people', 'Brighter days', 'A more human way forward']}
        image="/images/galeria/paisaje-olivo-good-people.jpg"
        imagePosition="85% center"
        imageAlt="Olivo sobre la piedra caliza junto a los acantilados y el mar Mediterráneo"
        script="Good vibes further"
        reversed
      />
      <Palette />
      <Gallery />
      <Newsletter />
    </>
  )
}

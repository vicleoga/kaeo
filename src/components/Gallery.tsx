import Reveal from './Reveal'
import { KaeoWord } from './Logo'

// Mosaico asimétrico con los paneles del moodboard (las frases manuscritas ya vienen en las fotos).
const TILES: { src: string; alt: string; className: string; position?: string }[] = [
  {
    src: 'galeria/paisaje-same-sun.jpg',
    alt: 'Acantilados de piedra caliza sobre el mar Mediterráneo con la frase manuscrita Same Sun Higher Standards',
    className: 'col-span-2 row-span-2 md:col-span-4 md:row-span-3',
    position: 'left center',
  },
  {
    src: 'galeria/cuello-sage-etiqueta.jpg',
    alt: 'Cuello de camiseta sage con el logo KAEO y las frases GOOD VIBES, BETTER DAYS, SLOW LIVING, con una etiqueta de cartón colgando',
    className: 'row-span-2 md:col-span-2 md:row-span-3',
  },
  {
    src: 'galeria/pilar-calmer-tomorrow.jpg',
    alt: 'Pilar de piedra con la frase CLOTHES FOR A CALMER TOMORROW y el logo KAEO grabados',
    className: 'row-span-2 md:col-span-2 md:row-span-3',
    position: '20% center',
  },
  {
    src: 'galeria/tejido-less-hurry.jpg',
    alt: 'Tejido washed blue con la frase LESS HURRY MORE LIFE',
    className: 'row-span-2 md:col-span-2 md:row-span-3',
  },
  {
    src: 'galeria/espalda-brighter-tomorrow.jpg',
    alt: 'Hombre sentado de espaldas frente al mar con camiseta washed black con la frase A BRIGHTER TOMORROW',
    className: 'row-span-2 md:col-span-2 md:row-span-3',
  },
  {
    src: 'galeria/pila-camisetas-frases.jpg',
    alt: 'Pila de camisetas dobladas en los cinco colores con las frases KAEO, GOOD VIBES, SLOW LIVING, BETTER DAYS y LESS HURRY MORE LIFE',
    className: 'row-span-2 md:col-span-2 md:row-span-2',
  },
  {
    src: 'galeria/paisaje-olivo-good-people.jpg',
    alt: 'Olivo junto a la costa con acantilados y la frase GOOD PEOPLE, BRIGHTER DAYS, A MORE HUMAN WAY FORWARD',
    className: 'col-span-2 row-span-2 md:col-span-4 md:row-span-2',
    position: 'left center',
  },
]

export default function Gallery() {
  return (
    <section className="px-5 py-24 md:px-10 md:py-36" aria-labelledby="journal-title">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mb-14 flex flex-col items-center text-center md:mb-20">
          <p className="label text-washed-black/60">Lookbook</p>
          <h2 id="journal-title" className="heading mt-6 text-2xl md:text-4xl">
            <KaeoWord /> <span className="ml-[0.2em]">Journal</span>
          </h2>
          <p className="heading mt-6 text-[11px] leading-7 tracking-label text-washed-black/70">Mediterranean state of mind</p>
          <span className="divider mt-8" aria-hidden="true" />
        </Reveal>

        <div className="grid auto-rows-[150px] grid-cols-2 gap-3 sm:auto-rows-[200px] md:auto-rows-[120px] md:grid-cols-6 md:gap-5 lg:auto-rows-[150px]">
          {TILES.map((t, i) => (
            <Reveal key={t.src} delay={(i % 3) * 120} className={`group relative overflow-hidden ${t.className}`}>
              <img
                src={`/images/${t.src}`}
                alt={t.alt}
                loading="lazy"
                style={{ objectPosition: t.position || 'center' }}
                className="h-full w-full object-cover transition-transform duration-[1800ms] ease-out group-hover:scale-105"
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

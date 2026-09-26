import { useCallback, useState } from 'react'
import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
import Manifesto from './components/Manifesto.jsx'
import CategorySection from './components/CategorySection.jsx'
import Palette from './components/Palette.jsx'
import Gallery from './components/Gallery.jsx'
import Newsletter from './components/Newsletter.jsx'
import Footer from './components/Footer.jsx'
import CartDrawer from './components/CartDrawer.jsx'
import SearchOverlay from './components/SearchOverlay.jsx'
import Reveal from './components/Reveal.jsx'

function Quote({ lines }) {
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

export default function App() {
  const [search, setSearch] = useState(false)
  const closeSearch = useCallback(() => setSearch(false), [])

  return (
    <>
      <a href="#hombre" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:bg-offwhite focus:px-4 focus:py-2">
        Saltar al contenido
      </a>
      <Navbar onSearch={() => setSearch(true)} />
      <main>
        <Hero />
        <Manifesto />
        <CategorySection
          id="hombre"
          title="Hombre"
          kicker="Men · Summer 01"
          lines={['Good vibes', 'Good flow', 'Better days', 'Slow living']}
          image="images/hombre-sentado-costa.jpg"
          imageAlt="Hombre de pelo ondulado con gafas de sol y camiseta off white KAEO sentado en la piedra frente a la costa, con la frase manuscrita Good Vibes Further"
        />
        <Quote lines={['Less hurry', 'More life']} />
        <CategorySection
          id="mujer"
          title="Mujer"
          kicker="Women · Summer 01"
          lines={['Good people', 'Brighter days', 'A more human way forward']}
          image="images/galeria/paisaje-olivo-good-people.jpg"
          imagePosition="85% center"
          imageAlt="Olivo sobre la piedra caliza junto a los acantilados y el mar Mediterráneo"
          script="Good vibes further"
          reversed
        />
        <Palette />
        <Gallery />
        <Newsletter />
      </main>
      <Footer />
      <CartDrawer />
      <SearchOverlay open={search} onClose={closeSearch} />
    </>
  )
}

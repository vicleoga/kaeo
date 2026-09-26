import Logo from './Logo.jsx'
import { asset } from '../lib/asset.js'

export default function Hero() {
  return (
    <section id="top" className="relative h-[100svh] min-h-[560px] w-full overflow-hidden bg-washed-black">
      <img
        src={asset('images/hero-costa-acantilados.jpg')}
        alt="Acantilados de piedra caliza sobre el mar Mediterráneo en calma, con luz cálida de tarde"
        className="absolute inset-0 h-full w-full animate-fade-in object-cover object-[68%_center] md:object-center"
        fetchpriority="high"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-washed-black/45 via-washed-black/20 to-washed-black/50" aria-hidden="true" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center text-offwhite">
        <h1 className="animate-fade-up">
          <span className="sr-only">KAEO</span>
          <Logo color="#F7F5EF" size="clamp(42px, 10vw, 104px)" title="KAEO" />
        </h1>
        <p className="label mt-8 animate-fade-up text-[11px] [animation-delay:250ms] md:mt-10 md:text-xs">Clothes for a brighter tomorrow</p>
        <span className="divider mt-6 animate-fade-up bg-offwhite [animation-delay:400ms]" aria-hidden="true" />
        <a href="#coleccion" className="btn-light mt-10 animate-fade-up [animation-delay:600ms]">
          Descubrir colección
        </a>
      </div>

      <p
        className="absolute bottom-8 right-6 z-10 -rotate-3 animate-fade-up font-script text-3xl text-offwhite/90 [animation-delay:900ms] md:right-12 md:text-5xl"
        aria-hidden="true"
      >
        Same sun, higher standards
      </p>
      <span className="label absolute bottom-8 left-6 z-10 hidden text-offwhite/80 sm:block md:left-12" aria-hidden="true">
        Mediterranean state of mind
      </span>
    </section>
  )
}

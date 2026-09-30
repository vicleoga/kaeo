import Reveal from './Reveal'
import { PALETTE, PALETTE_ORDER } from '@/data/palette'

// Como en el moodboard: las cinco camisetas en la barra y, debajo, nombre y código de cada color.
export default function Palette() {
  return (
    <section id="coleccion" className="scroll-mt-16 bg-sand/25 px-5 py-24 md:px-10 md:py-36">
      <div className="mx-auto max-w-6xl">
        <Reveal className="text-center">
          <p className="label text-washed-black/60">Summer collection · 01</p>
          <h2 className="heading mt-6 text-2xl md:text-4xl">The colour palette</h2>
          <p className="heading mt-6 text-[11px] leading-7 tracking-label text-washed-black/70">
            Washed by the sun
            <br />
            Softened by the sea
          </p>
          <span className="divider mx-auto mt-8" aria-hidden="true" />
        </Reveal>

        <Reveal delay={150} className="mt-16 md:mt-24">
          <div className="overflow-hidden">
            <img
              src="/images/coleccion-camisetas-colgadas.jpg"
              alt="Cinco camisetas KAEO colgadas en perchas de madera de una barra rústica, de izquierda a derecha: off white, sand, sage, washed blue y washed black"
              loading="lazy"
              className="w-full transition-transform duration-[1800ms] hover:scale-[1.03]"
            />
          </div>
          <ul className="mt-6 grid grid-cols-5 gap-2 text-center md:mt-8">
            {PALETTE_ORDER.map((key) => {
              const c = PALETTE[key]
              return (
                <li key={key}>
                  <span className="mx-auto mb-3 block h-3 w-3 rounded-full border border-washed-black/20" style={{ backgroundColor: c.hex }} aria-hidden="true" />
                  <p className="text-[8px] font-medium uppercase tracking-[0.2em] sm:text-[10px] sm:tracking-label">{c.name}</p>
                  <p className="mt-1.5 text-[8px] tracking-[0.18em] text-washed-black/60 sm:text-[10px] sm:tracking-[0.25em]">{c.hex}</p>
                </li>
              )
            })}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}

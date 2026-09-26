import ProductCard from './ProductCard.jsx'
import Reveal from './Reveal.jsx'
import { asset } from '../lib/asset.js'
import { byCategory } from '../data/products.js'

export default function CategorySection({ id, title, kicker, lines, image, imageAlt, imagePosition = 'center', script, reversed = false }) {
  const products = byCategory(id)
  return (
    <section id={id} className="scroll-mt-16 px-5 py-20 md:px-10 md:py-32">
      <div className="mx-auto max-w-7xl">
        <div className={`grid items-center gap-10 md:grid-cols-2 md:gap-20 ${reversed ? 'md:[&>*:first-child]:order-2' : ''}`}>
          <Reveal className="relative">
            <div className="aspect-[4/5] overflow-hidden">
              <img
                src={asset(image)}
                alt={imageAlt}
                loading="lazy"
                style={{ objectPosition: imagePosition }}
                className="h-full w-full object-cover transition-transform duration-[2000ms] hover:scale-[1.03]"
              />
            </div>
            {script && (
              <p className={`absolute bottom-6 font-script text-4xl md:text-5xl text-offwhite -rotate-3 ${reversed ? 'left-6' : 'right-6'}`} aria-hidden="true">
                {script}
              </p>
            )}
          </Reveal>
          <Reveal delay={150} className={`${reversed ? 'md:text-right' : ''}`}>
            <p className="label text-washed-black/60">{kicker}</p>
            <h2 className="heading mt-6 text-5xl sm:text-6xl md:text-7xl tracking-[0.18em]">{title}</h2>
            <p className="heading mt-8 text-xs leading-7 tracking-label text-washed-black/80">
              {lines.map((l) => (
                <span key={l} className="block">{l}</span>
              ))}
            </p>
            <span className={`divider mt-8 ${reversed ? 'md:ml-auto' : ''}`} aria-hidden="true" />
            <a href={`#${id}-productos`} className="btn-dark mt-10">
              Ver {products.length} prendas
            </a>
          </Reveal>
        </div>

        <div id={`${id}-productos`} className="mt-20 grid scroll-mt-24 grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 md:mt-28 lg:grid-cols-4 lg:gap-x-8">
          {products.map((p, i) => (
            <Reveal key={p.id} delay={(i % 4) * 90}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

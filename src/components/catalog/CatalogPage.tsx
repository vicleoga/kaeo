import Link from 'next/link'
import ProductCard from '@/components/ProductCard'
import Reveal from '@/components/Reveal'
import { listCatalog, type CatalogFilters as Filters, type CatalogSort } from '@/server/catalog'
import type { CategorySlug } from '@/lib/types'
import CatalogFilters from './CatalogFilters'

const COPY: Record<CategorySlug, { title: string; kicker: string; lines: string[]; other: CategorySlug }> = {
  hombre: { title: 'Hombre', kicker: 'Men · Summer 01', lines: ['Good vibes', 'Good flow', 'Better days'], other: 'mujer' },
  mujer: { title: 'Mujer', kicker: 'Women · Summer 01', lines: ['Good people', 'Brighter days', 'Slow living'], other: 'hombre' },
}

const SORTS: CatalogSort[] = ['destacados', 'precio-asc', 'precio-desc', 'novedades']

export function parseFilters(sp: Record<string, string | string[] | undefined>): Filters {
  const one = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string).slice(0, 40) : undefined) || undefined
  const orden = one('orden') as CatalogSort | undefined
  return { color: one('color'), talla: one('talla'), orden: orden && SORTS.includes(orden) ? orden : undefined }
}

export default async function CatalogPage({ category, filters }: { category: CategorySlug; filters: Filters }) {
  const { products, colorOptions, sizeOptions, total } = await listCatalog(category, filters)
  const copy = COPY[category]

  return (
    <div className="px-5 pb-28 pt-28 md:px-10 md:pt-40">
      <div className="mx-auto max-w-7xl">
        <Reveal as="header" className="text-center">
          <p className="label text-washed-black/60">{copy.kicker}</p>
          <h1 className="heading mt-6 text-5xl tracking-[0.18em] sm:text-6xl md:text-7xl">{copy.title}</h1>
          <p className="heading mt-8 text-[11px] leading-7 tracking-label text-washed-black/70">
            {copy.lines.map((l) => (
              <span key={l} className="block">
                {l}
              </span>
            ))}
          </p>
          <span className="divider mx-auto mt-8" aria-hidden="true" />
        </Reveal>

        <div className="mt-16 flex flex-wrap items-end justify-between gap-6 border-y border-washed-black/10 py-6 md:mt-20">
          <CatalogFilters basePath={`/${category}`} colors={colorOptions} sizes={sizeOptions} current={filters} />
          <p className="label text-washed-black/60" aria-live="polite">
            {products.length === total ? `${total} prendas` : `${products.length} de ${total} prendas`}
          </p>
        </div>

        {products.length === 0 ? (
          <div className="py-24 text-center">
            <p className="heading text-xs leading-7 tracking-label text-washed-black/70">
              Nothing here
              <br />
              with these filters
            </p>
            <Link href={`/${category}`} className="btn-dark mt-10">
              Ver todo
            </Link>
          </div>
        ) : (
          <ul className="mt-14 grid grid-cols-2 gap-x-4 gap-y-14 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8">
            {products.map((p, i) => (
              <Reveal as="li" key={p.id} delay={(i % 4) * 90}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </ul>
        )}

        <div className="mt-28 text-center">
          <Link href={`/${copy.other}`} className="btn-dark">
            Ver {COPY[copy.other].title}
          </Link>
        </div>
      </div>
    </div>
  )
}

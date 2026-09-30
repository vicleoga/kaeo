import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProductDetail, relatedProducts } from '@/server/catalog'
import ProductCard from '@/components/ProductCard'
import Reveal from '@/components/Reveal'
import ProductView from './ProductView'

type Props = { params: Promise<{ slug: string }> }

const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const p = await getProductDetail(slug)
  if (!p) return { title: 'Producto no encontrado' }
  const description = p.seoDescription || p.description.slice(0, 155) || `${p.name} — KAEO, clothes for a brighter tomorrow.`
  return {
    title: p.seoTitle || p.name,
    description,
    alternates: { canonical: `/producto/${p.slug}` },
    openGraph: { type: 'website', title: p.seoTitle || p.name, description, images: p.images.slice(0, 1).map((i) => ({ url: i.url, alt: i.alt })) },
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const product = await getProductDetail(slug)
  if (!product) notFound()
  const related = await relatedProducts(product)
  const categoryName = product.category === 'hombre' ? 'Hombre' : 'Mujer'

  // Datos estructurados para buscadores (schema.org Product + Offer)
  const base = siteUrl()
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        name: product.name,
        description: product.description || undefined,
        image: product.images.map((i) => (i.url.startsWith('http') ? i.url : `${base}${i.url}`)),
        sku: product.variants[0]?.sku,
        brand: { '@type': 'Brand', name: 'KAEO' },
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'EUR',
          lowPrice: (Math.min(...product.variants.map((v) => v.priceCents)) / 100).toFixed(2),
          highPrice: (Math.max(...product.variants.map((v) => v.priceCents)) / 100).toFixed(2),
          offerCount: product.variants.length,
          availability: product.variants.some((v) => v.available) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          url: `${base}/producto/${product.slug}`,
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${base}/` },
          { '@type': 'ListItem', position: 2, name: categoryName, item: `${base}/${product.category}` },
          { '@type': 'ListItem', position: 3, name: product.name },
        ],
      },
    ],
  }

  return (
    <div className="px-5 pb-24 pt-24 md:px-10 md:pt-32">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <div className="mx-auto max-w-7xl">
        <nav aria-label="Migas de pan" className="mb-8 text-[10px] uppercase tracking-[0.22em] text-washed-black/55">
          <ol className="flex flex-wrap gap-2">
            <li>
              <Link href="/" className="hover:text-washed-black">
                Inicio
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href={`/${product.category}`} className="hover:text-washed-black">
                {categoryName}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-washed-black">
              {product.name}
            </li>
          </ol>
        </nav>

        <ProductView product={product} />

        {related.length > 0 && (
          <section className="mt-28" aria-labelledby="relacionados">
            <Reveal className="text-center">
              <h2 id="relacionados" className="heading text-lg md:text-2xl">
                También te puede gustar
              </h2>
              <span className="divider mx-auto mt-6" aria-hidden="true" />
            </Reveal>
            <div className="mt-14 grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8">
              {related.map((p, i) => (
                <Reveal key={p.id} delay={i * 90}>
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

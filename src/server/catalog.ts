import 'server-only'
import { prisma } from './db'
import type { CategorySlug, ProductSummary } from '@/lib/types'
import type { Prisma } from '@/generated/prisma/client'

const summaryInclude = {
  images: { orderBy: { sortOrder: 'asc' }, include: { color: true } },
  variants: { where: { active: true }, include: { color: true } },
} satisfies Prisma.ProductInclude

type ProductWithRelations = Prisma.ProductGetPayload<{ include: typeof summaryInclude }>

export const toCategorySlug = (c: 'HOMBRE' | 'MUJER'): CategorySlug => (c === 'HOMBRE' ? 'hombre' : 'mujer')

function toSummary(p: ProductWithRelations): ProductSummary {
  const main = p.images[0]
  // Colores distintos de las variantes activas; primero el de la foto principal.
  const colors = [...new Map(p.variants.map((v) => [v.color.key, v.color])).values()].sort((a, b) =>
    a.id === main?.colorId ? -1 : b.id === main?.colorId ? 1 : a.sortOrder - b.sortOrder,
  )
  const imageByColor: Record<string, string> = {}
  for (const img of p.images) if (img.color && !imageByColor[img.color.key]) imageByColor[img.color.key] = img.thumbUrl ?? img.url

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: toCategorySlug(p.category),
    priceCents: p.priceCents,
    image: main ? (main.thumbUrl ?? main.url) : '/images/moodboard/kaeo-moodboard.webp',
    alt: main?.alt || p.name,
    colors: colors.map(({ key, name, hex }) => ({ key, name, hex })),
    imageByColor,
  }
}

/** Productos publicados, en el orden definido en el admin. */
export async function listStoreProducts(opts: { category?: CategorySlug; homeOnly?: boolean } = {}) {
  const products = await prisma.product.findMany({
    where: {
      status: 'PUBLISHED',
      ...(opts.category ? { category: opts.category === 'hombre' ? 'HOMBRE' : 'MUJER' } : {}),
      ...(opts.homeOnly ? { showOnHome: true } : {}),
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    include: summaryInclude,
  })
  return products.filter((p) => p.variants.length > 0).map(toSummary)
}

import 'server-only'
import { prisma } from './db'
import { variantAvailability } from '@/lib/stock'
import type { SizeGuide } from '@/lib/catalog'
import type { CategorySlug, ColorInfo, ProductDetail, ProductSummary } from '@/lib/types'
import type { Prisma } from '@/generated/prisma/client'

const productInclude = {
  images: { orderBy: { sortOrder: 'asc' }, include: { color: true } },
  variants: { where: { active: true }, include: { color: true } },
} satisfies Prisma.ProductInclude

type ProductWithRelations = Prisma.ProductGetPayload<{ include: typeof productInclude }>

export const toCategorySlug = (c: 'HOMBRE' | 'MUJER'): CategorySlug => (c === 'HOMBRE' ? 'hombre' : 'mujer')
const toCategoryEnum = (c: CategorySlug) => (c === 'hombre' ? 'HOMBRE' : 'MUJER')

const FALLBACK_IMAGE = '/images/moodboard/kaeo-moodboard.webp'

function toSummary(p: ProductWithRelations): ProductSummary {
  const main = p.images[0]
  // Colores distintos de las variantes activas; primero el de la foto principal.
  const colors = [...new Map(p.variants.map((v) => [v.color.key, v.color])).values()].sort((a, b) =>
    a.id === main?.colorId ? -1 : b.id === main?.colorId ? 1 : a.sortOrder - b.sortOrder,
  )
  const imageByColor: Record<string, string> = {}
  for (const img of p.images) if (img.color && !imageByColor[img.color.key]) imageByColor[img.color.key] = img.thumbUrl ?? img.url

  const variants = p.variants.map((v) => ({
    id: v.id,
    sku: v.sku,
    size: v.size,
    colorKey: v.color.key,
    priceCents: v.priceCents ?? p.priceCents,
    ...variantAvailability(p.stockMode, v),
  }))
  const activeSizes = new Set(variants.map((v) => v.size))

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: toCategorySlug(p.category),
    priceCents: p.priceCents,
    minPriceCents: Math.min(...variants.map((v) => v.priceCents)),
    image: main ? (main.thumbUrl ?? main.url) : FALLBACK_IMAGE,
    alt: main?.alt || p.name,
    colors: colors.map(({ key, name, hex }): ColorInfo => ({ key, name, hex })),
    sizes: p.sizes.filter((s) => activeSizes.has(s)),
    variants,
    imageByColor,
  }
}

const published = { status: 'PUBLISHED' } as const
const order: Prisma.ProductOrderByWithRelationInput[] = [{ sortOrder: 'asc' }, { createdAt: 'asc' }]

/** Productos publicados, en el orden definido en el admin. */
export async function listStoreProducts(opts: { category?: CategorySlug; homeOnly?: boolean } = {}) {
  const products = await prisma.product.findMany({
    where: {
      ...published,
      ...(opts.category ? { category: toCategoryEnum(opts.category) } : {}),
      ...(opts.homeOnly ? { showOnHome: true } : {}),
    },
    orderBy: order,
    include: productInclude,
  })
  return products.filter((p) => p.variants.length > 0).map(toSummary)
}

export type CatalogSort = 'destacados' | 'precio-asc' | 'precio-desc' | 'novedades'

export interface CatalogFilters {
  color?: string
  talla?: string
  orden?: CatalogSort
}

/**
 * Catálogo de una categoría con filtros. El catálogo es pequeño (decenas de productos),
 * así que se filtra en memoria sobre los productos publicados de la categoría.
 */
export async function listCatalog(category: CategorySlug, filters: CatalogFilters) {
  const all = await prisma.product.findMany({
    where: { ...published, category: toCategoryEnum(category) },
    orderBy: filters.orden === 'novedades' ? [{ createdAt: 'desc' }] : order,
    include: productInclude,
  })
  const summaries = all.filter((p) => p.variants.length > 0).map(toSummary)

  // Opciones de filtro: todos los colores y tallas de la categoría (en orden de aparición)
  const colorOptions = [...new Map(summaries.flatMap((p) => p.colors).map((c) => [c.key, c])).values()]
  const sizeOptions = [...new Set(summaries.flatMap((p) => p.sizes))]

  let products = summaries.filter(
    (p) =>
      (!filters.color || p.variants.some((v) => v.colorKey === filters.color && v.available)) &&
      (!filters.talla || p.variants.some((v) => v.size === filters.talla && v.available)),
  )
  if (filters.orden === 'precio-asc') products = [...products].sort((a, b) => a.minPriceCents - b.minPriceCents)
  if (filters.orden === 'precio-desc') products = [...products].sort((a, b) => b.minPriceCents - a.minPriceCents)

  // Si se filtra por color, la tarjeta muestra de entrada ese color.
  if (filters.color) {
    products = products.map((p) => ({
      ...p,
      colors: [...p.colors].sort((a, b) => (a.key === filters.color ? -1 : b.key === filters.color ? 1 : 0)),
    }))
  }

  return { products, colorOptions, sizeOptions, total: summaries.length }
}

/** Ficha completa de un producto publicado, o null. */
export async function getProductDetail(slug: string): Promise<ProductDetail | null> {
  const p = await prisma.product.findFirst({ where: { slug, ...published }, include: productInclude })
  if (!p || p.variants.length === 0) return null
  return {
    ...toSummary(p),
    description: p.description,
    composition: p.composition,
    care: p.care,
    sizeGuide: (p.sizeGuide as SizeGuide | null) ?? null,
    images: p.images.map((i) => ({ url: i.url, thumbUrl: i.thumbUrl ?? i.url, alt: i.alt || p.name, colorKey: i.color?.key ?? null })),
    seoTitle: p.seoTitle,
    seoDescription: p.seoDescription,
  }
}

/** Otros productos de la misma categoría para "También te puede gustar". */
export async function relatedProducts(product: { id: string; category: CategorySlug }, limit = 4) {
  const products = await listStoreProducts({ category: product.category })
  return products.filter((p) => p.id !== product.id).slice(0, limit)
}

/** Para el sitemap */
export function publishedProductSlugs() {
  return prisma.product.findMany({ where: published, select: { slug: true, updatedAt: true } })
}

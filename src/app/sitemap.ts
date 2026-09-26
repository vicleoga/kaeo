import type { MetadataRoute } from 'next'
import { publishedProductSlugs } from '@/server/catalog'

export const dynamic = 'force-dynamic'

const base = () => (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await publishedProductSlugs()
  const now = new Date()
  const pages = ['', '/hombre', '/mujer'].map((path) => ({ url: `${base()}${path}`, lastModified: now, changeFrequency: 'weekly' as const, priority: path ? 0.8 : 1 }))
  return [
    ...pages,
    ...products.map((p) => ({ url: `${base()}/producto/${p.slug}`, lastModified: p.updatedAt, changeFrequency: 'weekly' as const, priority: 0.7 })),
  ]
}

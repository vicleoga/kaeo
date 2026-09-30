import type { MetadataRoute } from 'next'
import { publishedProductSlugs } from '@/server/catalog'

export const dynamic = 'force-dynamic'

const base = () => (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await publishedProductSlugs()
  const now = new Date()
  const pages = ['', '/hombre', '/mujer'].map((path) => ({ url: `${base()}${path}`, lastModified: now, changeFrequency: 'weekly' as const, priority: path ? 0.8 : 1 }))
  const info = ['/nosotros', '/contacto', '/preguntas-frecuentes', '/envios-y-devoluciones', '/legal/aviso-legal', '/legal/condiciones', '/legal/privacidad', '/legal/cookies'].map((path) => ({
    url: `${base()}${path}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: path.startsWith('/legal') ? 0.2 : 0.5,
  }))
  return [
    ...pages,
    ...info,
    ...products.map((p) => ({ url: `${base()}/producto/${p.slug}`, lastModified: p.updatedAt, changeFrequency: 'weekly' as const, priority: 0.7 })),
  ]
}

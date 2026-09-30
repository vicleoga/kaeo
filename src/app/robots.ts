import type { MetadataRoute } from 'next'
import { isStaging } from '@/lib/env'

export default function robots(): MetadataRoute.Robots {
  // Tienda de pruebas: no se indexa nada.
  if (isStaging) return { rules: [{ userAgent: '*', disallow: '/' }] }
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/carrito', '/checkout', '/pedido', '/seguimiento'] }],
    sitemap: `${base}/sitemap.xml`,
  }
}

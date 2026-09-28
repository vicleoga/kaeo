import type { NextConfig } from 'next'

const staging = process.env.NEXT_PUBLIC_SITE_ENV === 'staging'
const siteHost = (() => {
  try {
    return process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL).host : undefined
  } catch {
    return undefined
  }
})()

const nextConfig: NextConfig = {
  // En Docker (NEXT_OUTPUT=standalone) `next build` genera .next/standalone con su propio
  // server.js y solo las dependencias necesarias → imagen mínima. En local se usa `next start`.
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  poweredByHeader: false,
  experimental: {
    serverActions: {
      // Subida de fotos desde el admin (hasta 12 a la vez; cada una se limita a 15 MB en el servidor)
      bodySizeLimit: '64mb',
      // Detrás de un proxy/túnel (Cloudflare), el dominio público se acepta como origen válido (CSRF)
      ...(siteHost ? { allowedOrigins: [siteHost] } : {}),
    },
  },
  async headers() {
    const security = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ]
    // En staging, además, ningún buscador indexa nada (refuerza robots.txt y los metadatos).
    if (staging) security.push({ key: 'X-Robots-Tag', value: 'noindex, nofollow' })
    return [{ source: '/:path*', headers: security }]
  },
}

export default nextConfig

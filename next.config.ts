import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // En Docker (NEXT_OUTPUT=standalone) `next build` genera .next/standalone con su propio
  // server.js y solo las dependencias necesarias → imagen mínima. En local se usa `next start`.
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  poweredByHeader: false,
  experimental: {
    serverActions: {
      // Subida de fotos desde el admin (hasta 12 a la vez; cada una se limita a 15 MB en el servidor)
      bodySizeLimit: '64mb',
    },
  },
}

export default nextConfig

import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { Jost, Mrs_Saint_Delafield } from 'next/font/google'
import { CartProvider } from '@/context/CartContext'
import { isStaging } from '@/lib/env'
import './globals.css'

// next/font descarga las fuentes al compilar y las sirve desde nuestro dominio:
// sin peticiones a Google desde el navegador del cliente (mejor para RGPD y velocidad).
const jost = Jost({ subsets: ['latin'], weight: ['300', '400', '500', '600'], variable: '--font-jost', display: 'swap' })
const script = Mrs_Saint_Delafield({ subsets: ['latin'], weight: '400', variable: '--font-script', display: 'swap' })

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'KAEO — Clothes for a brighter tomorrow',
    template: '%s — KAEO',
  },
  description:
    'KAEO — Clothes for a brighter tomorrow. Camisetas y básicos de algodón orgánico y lino con espíritu mediterráneo.',
  icons: { icon: '/favicon.svg' },
  // La tienda de pruebas no se indexa
  ...(isStaging ? { robots: { index: false, follow: false } } : {}),
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    siteName: 'KAEO',
    images: ['/images/hero-costa-acantilados.jpg'],
  },
}

export const viewport: Viewport = {
  themeColor: '#F7F5EF',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${jost.variable} ${script.variable}`}>
      {/* suppressHydrationWarning: extensiones como Grammarly añaden atributos al <body> */}
      <body suppressHydrationWarning>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  )
}

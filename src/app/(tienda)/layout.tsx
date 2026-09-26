import type { ReactNode } from 'react'
import SiteChrome from '@/components/SiteChrome'
import Footer from '@/components/Footer'

// Marco común de todas las páginas públicas de la tienda.
export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:bg-offwhite focus:px-4 focus:py-2"
      >
        Saltar al contenido
      </a>
      <SiteChrome />
      <main id="contenido">{children}</main>
      <Footer />
    </>
  )
}

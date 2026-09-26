import type { ReactNode } from 'react'
import SiteChrome from '@/components/SiteChrome'
import Footer from '@/components/Footer'
import { listStoreProducts } from '@/server/catalog'
import { freeShippingThreshold } from '@/server/shipping'

// La tienda lee el catálogo de la base de datos en cada petición (los cambios del admin se ven al momento).
export const dynamic = 'force-dynamic'

// Marco común de todas las páginas públicas de la tienda.
export default async function StoreLayout({ children }: { children: ReactNode }) {
  const [products, freeShippingFromCents] = await Promise.all([listStoreProducts(), freeShippingThreshold()])
  return (
    <>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:bg-offwhite focus:px-4 focus:py-2"
      >
        Saltar al contenido
      </a>
      <SiteChrome products={products} freeShippingFromCents={freeShippingFromCents} />
      <main id="contenido">{children}</main>
      <Footer />
    </>
  )
}

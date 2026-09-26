'use client'

import { useCallback, useState } from 'react'
import Navbar from './Navbar'
import CartDrawer from './CartDrawer'
import SearchOverlay from './SearchOverlay'
import type { ProductSummary } from '@/lib/types'

// Piezas interactivas comunes a todas las páginas: navegación, carrito lateral y buscador.
export default function SiteChrome({ products }: { products: ProductSummary[] }) {
  const [search, setSearch] = useState(false)
  const closeSearch = useCallback(() => setSearch(false), [])

  return (
    <>
      <Navbar onSearch={() => setSearch(true)} />
      <CartDrawer />
      <SearchOverlay open={search} onClose={closeSearch} products={products} />
    </>
  )
}

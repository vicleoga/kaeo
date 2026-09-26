'use client'

import { useCallback, useState } from 'react'
import Navbar from './Navbar'
import CartDrawer from './CartDrawer'
import SearchOverlay from './SearchOverlay'
import type { ProductSummary } from '@/lib/types'

// Piezas interactivas comunes a todas las páginas: navegación, carrito lateral y buscador.
interface Props {
  products: ProductSummary[]
  freeShippingFromCents: number | null
}

export default function SiteChrome({ products, freeShippingFromCents }: Props) {
  const [search, setSearch] = useState(false)
  const closeSearch = useCallback(() => setSearch(false), [])

  return (
    <>
      <Navbar onSearch={() => setSearch(true)} />
      <CartDrawer freeShippingFromCents={freeShippingFromCents} />
      <SearchOverlay open={search} onClose={closeSearch} products={products} />
    </>
  )
}

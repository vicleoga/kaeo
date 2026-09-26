// Tipos compartidos entre servidor y cliente (no importar aquí nada de Prisma ni del servidor).

import type { SizeGuide } from './catalog'

export type CategorySlug = 'hombre' | 'mujer'

export interface ColorInfo {
  key: string
  name: string
  hex: string
}

/** Variante tal y como se ofrece en la tienda */
export interface VariantInfo {
  id: string
  sku: string
  size: string
  colorKey: string
  /** Precio efectivo (el de la variante o, si no tiene, el del producto), céntimos con IVA */
  priceCents: number
  available: boolean
  /** Unidades máximas que se pueden añadir al carrito */
  maxQty: number
  /** Stock restante si es de stock propio y queda poco (para avisar "últimas unidades") */
  lowStock: number | null
}

/** Producto tal y como lo necesitan las tarjetas, el buscador y el carrito. */
export interface ProductSummary {
  id: string
  slug: string
  name: string
  category: CategorySlug
  /** Precio base en céntimos, IVA incluido */
  priceCents: number
  /** Precio mínimo entre variantes activas (para "desde …" si hay precios distintos) */
  minPriceCents: number
  image: string
  alt: string
  /** Colores disponibles; el primero es el color por defecto */
  colors: ColorInfo[]
  /** Tallas del producto en su orden (solo las que tienen alguna variante activa) */
  sizes: string[]
  variants: VariantInfo[]
  /** Foto específica de cada color, si la hay (clave de color → URL) */
  imageByColor: Record<string, string>
}

export interface ProductImageInfo {
  url: string
  thumbUrl: string
  alt: string
  colorKey: string | null
}

export interface ProductDetail extends ProductSummary {
  description: string
  composition: string
  care: string
  sizeGuide: SizeGuide | null
  images: ProductImageInfo[]
  seoTitle: string | null
  seoDescription: string | null
}

/** Línea del carrito (se guarda en el navegador; el servidor revalida precio y stock). */
export interface CartLine {
  variantId: string
  productId: string
  slug: string
  name: string
  sku: string
  size: string
  color: ColorInfo
  priceCents: number
  image: string
  qty: number
  maxQty: number
  /** El servidor la ha marcado como no disponible (agotada, despublicada…) */
  unavailable?: boolean
}

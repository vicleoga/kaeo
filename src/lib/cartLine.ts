import type { CartLine, ColorInfo, ProductSummary, VariantInfo } from './types'

/** Línea de carrito a partir de un producto y la variante elegida (el servidor la revalida después). */
export function toCartLine(product: ProductSummary, variant: VariantInfo, color: ColorInfo, image?: string): Omit<CartLine, 'qty'> {
  return {
    variantId: variant.id,
    productId: product.id,
    slug: product.slug,
    name: product.name,
    sku: variant.sku,
    size: variant.size,
    color,
    priceCents: variant.priceCents,
    image: image ?? product.imageByColor[color.key] ?? product.image,
    maxQty: variant.maxQty,
  }
}

/** Precio a mostrar: "39,00 €" o "desde 39,00 €" si las variantes tienen precios distintos. */
export function hasPriceRange(p: ProductSummary) {
  return p.variants.some((v) => v.priceCents !== p.minPriceCents)
}

// Tipos compartidos entre servidor y cliente (no importar aquí nada de Prisma ni del servidor).

export type CategorySlug = 'hombre' | 'mujer'

export interface ColorInfo {
  key: string
  name: string
  hex: string
}

/** Producto tal y como lo necesitan las tarjetas, el buscador y el carrito. */
export interface ProductSummary {
  id: string
  slug: string
  name: string
  category: CategorySlug
  /** Precio base en céntimos, IVA incluido */
  priceCents: number
  image: string
  alt: string
  /** Colores disponibles; el primero es el color por defecto */
  colors: ColorInfo[]
  /** Foto específica de cada color, si la hay (clave de color → URL) */
  imageByColor: Record<string, string>
}

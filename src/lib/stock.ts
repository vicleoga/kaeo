// Reglas de disponibilidad (puras: se usan en servidor y cliente).

export const MAX_QTY_PER_LINE = 10
/** Por debajo de este stock se avisa "últimas unidades" en la ficha */
export const LOW_STOCK_NOTICE = 3

export type StockModeValue = 'ON_DEMAND' | 'OWN_STOCK'

export function variantAvailability(stockMode: StockModeValue, v: { active: boolean; stock: number }) {
  if (!v.active) return { available: false, maxQty: 0, lowStock: null }
  if (stockMode === 'ON_DEMAND') return { available: true, maxQty: MAX_QTY_PER_LINE, lowStock: null }
  const maxQty = Math.min(MAX_QTY_PER_LINE, Math.max(0, v.stock))
  return {
    available: v.stock > 0,
    maxQty,
    lowStock: v.stock > 0 && v.stock <= LOW_STOCK_NOTICE ? v.stock : null,
  }
}

// Utilidades de catálogo puras (sin acceso a BD): se usan en el servidor, en el admin y en el seed.

/** "Linen Shirt – Sand" → "linen-shirt-sand" */
export function slugify(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Código interno correlativo del producto: 7 → "KA0007" */
export const productCode = (n: number) => `KA${String(n).padStart(4, '0')}`

/** SKU de una variante: KA0007-SGE-M */
export function skuFor(productCode: string, colorCode: string, size: string) {
  const s = size.normalize('NFD').replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'U'
  return `${productCode}-${colorCode}-${s}`
}

/** "39,90" | "39.9" | "39" → 3990. Devuelve null si no es un importe válido. */
export function parseEuros(input: string): number | null {
  const clean = input.trim().replace(/\s|€/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null
  return Math.round(parseFloat(clean) * 100)
}

/** 3990 → "39,90 €" */
export const formatCents = (cents: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(cents / 100)

/** 3990 → "39,90" (para rellenar inputs) */
export const centsToInput = (cents: number | null | undefined) =>
  cents == null ? '' : (cents / 100).toFixed(2).replace('.', ',')

/** "XS, S, M" → ["XS", "S", "M"] (sin vacíos ni duplicados, respetando el orden) */
export function parseSizes(input: string) {
  return [...new Set(input.split(/[,\n;]/).map((s) => s.trim()).filter(Boolean))]
}

// `type` y no `interface`: Prisma exige que los valores JSON sean compatibles con un índice de strings.
export type SizeGuide = {
  columns: string[]
  rows: string[][]
}

/** Texto del admin (una fila por línea, columnas separadas por "|") → guía de tallas */
export function parseSizeGuide(text: string): SizeGuide | null {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length < 2) return null
  const [header, ...rows] = lines.map((l) => l.split('|').map((c) => c.trim()))
  return { columns: header, rows }
}

export function sizeGuideToText(guide: unknown): string {
  const g = guide as SizeGuide | null
  if (!g?.columns) return ''
  return [g.columns, ...g.rows].map((r) => r.join(' | ')).join('\n')
}

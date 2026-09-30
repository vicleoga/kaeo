import { z } from 'zod'
import { parseEuros, parseSizeGuide, parseSizes } from '@/lib/catalog'

// Validación del formulario de producto del admin. Se ejecuta SIEMPRE en el servidor
// (la del navegador es solo una ayuda). Convierte los textos del formulario a los tipos de la BD.

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres`)
    .transform((v) => v || null)

export const productSchema = z.object({
  name: z.string().trim().min(2, 'Escribe un nombre').max(120, 'Máximo 120 caracteres'),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(120)
    .refine((v) => v === '' || /^[a-z0-9]+(-[a-z0-9]+)*$/.test(v), 'Solo minúsculas, números y guiones'),
  category: z.enum(['HOMBRE', 'MUJER'], 'Elige una categoría'),
  status: z.enum(['DRAFT', 'PUBLISHED']),
  stockMode: z.enum(['ON_DEMAND', 'OWN_STOCK']),
  price: z
    .string()
    .transform((v, ctx) => {
      const cents = parseEuros(v)
      if (cents == null || cents <= 0 || cents > 10_000_00) {
        ctx.addIssue({ code: 'custom', message: 'Precio no válido (p. ej. 39,90)' })
        return z.NEVER
      }
      return cents
    }),
  cost: z.string().transform((v, ctx) => {
    if (!v.trim()) return null
    const cents = parseEuros(v)
    if (cents == null || cents > 10_000_00) {
      ctx.addIssue({ code: 'custom', message: 'Coste no válido (p. ej. 9,50)' })
      return z.NEVER
    }
    return cents
  }),
  vatRate: z.string().transform((v, ctx) => {
    const t = v.trim().replace(',', '.').replace('%', '')
    if (t === '') return null
    const n = Number(t)
    if (!Number.isFinite(n) || n < 0 || n > 30) {
      ctx.addIssue({ code: 'custom', message: 'IVA no válido (deja vacío para usar el general)' })
      return z.NEVER
    }
    return Math.round(n * 100)
  }),
  description: z.string().trim().max(5000),
  composition: z.string().trim().max(500),
  care: z.string().trim().max(1000),
  sizes: z.string().transform((v, ctx) => {
    const sizes = parseSizes(v)
    if (sizes.length === 0) ctx.addIssue({ code: 'custom', message: 'Indica al menos una talla' })
    if (sizes.length > 20) ctx.addIssue({ code: 'custom', message: 'Máximo 20 tallas' })
    if (sizes.some((s) => s.length > 20)) ctx.addIssue({ code: 'custom', message: 'Cada talla, máximo 20 caracteres' })
    return sizes
  }),
  colorIds: z.array(z.string().min(1)).min(1, 'Elige al menos un color').max(20),
  sizeGuide: z.string().transform((v, ctx) => {
    if (!v.trim()) return null
    const guide = parseSizeGuide(v)
    if (!guide) {
      ctx.addIssue({ code: 'custom', message: 'Formato: una fila por línea y columnas separadas por "|" (la primera fila son los títulos)' })
      return z.NEVER
    }
    return guide
  }),
  providerRef: optionalText(200),
  seoTitle: optionalText(70),
  seoDescription: optionalText(160),
  showOnHome: z.boolean(),
  sortOrder: z.coerce.number().int('Número entero').min(0).max(100_000),
})

export type ProductInput = z.output<typeof productSchema>

export function productFormData(formData: FormData) {
  const s = (k: string) => String(formData.get(k) ?? '')
  return {
    name: s('name'),
    slug: s('slug'),
    category: s('category'),
    status: s('status'),
    stockMode: s('stockMode'),
    price: s('price'),
    cost: s('cost'),
    vatRate: s('vatRate'),
    description: s('description'),
    composition: s('composition'),
    care: s('care'),
    sizes: s('sizes'),
    colorIds: formData.getAll('colorIds').map(String),
    sizeGuide: s('sizeGuide'),
    providerRef: s('providerRef'),
    seoTitle: s('seoTitle'),
    seoDescription: s('seoDescription'),
    showOnHome: formData.get('showOnHome') === 'on',
    sortOrder: s('sortOrder') || '0',
  }
}

/** Primer mensaje de error de cada campo, para mostrarlo junto al input. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '_')
    out[key] ??= issue.message
  }
  return out
}

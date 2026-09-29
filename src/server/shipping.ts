import 'server-only'
import { prisma } from './db'

/** Umbral de envío gratis de la península (orientativo para el carrito; el checkout calcula el real). */
export async function freeShippingThreshold() {
  const zone = await prisma.shippingZone.findUnique({ where: { code: 'PENINSULA' }, select: { active: true, freeFromCents: true } })
  return zone?.active ? zone.freeFromCents : null
}

export const COUNTRY_NAMES: Record<string, string> = {
  ES: 'España', PT: 'Portugal', FR: 'Francia', IT: 'Italia', DE: 'Alemania', AT: 'Austria', BE: 'Bélgica', BG: 'Bulgaria',
  HR: 'Croacia', CY: 'Chipre', CZ: 'Chequia', DK: 'Dinamarca', EE: 'Estonia', FI: 'Finlandia', GR: 'Grecia', HU: 'Hungría',
  IE: 'Irlanda', LV: 'Letonia', LT: 'Lituania', LU: 'Luxemburgo', MT: 'Malta', NL: 'Países Bajos', PL: 'Polonia',
  RO: 'Rumanía', SK: 'Eslovaquia', SI: 'Eslovenia', SE: 'Suecia',
}

/** Países a los que se vende ahora mismo (los de alguna zona activa). */
export async function activeCountries() {
  const zones = await prisma.shippingZone.findMany({ where: { active: true }, select: { countries: true } })
  const codes = [...new Set(zones.flatMap((z) => z.countries))]
  return codes.map((code) => ({ code, name: COUNTRY_NAMES[code] ?? code })).sort((a, b) => (a.code === 'ES' ? -1 : b.code === 'ES' ? 1 : a.name.localeCompare(b.name)))
}

// Ceuta y Melilla: fuera de todas las zonas hasta que se decida cómo tratarlas (IPSI, aduana).
const UNSERVED_ES_PREFIXES = ['51', '52']

export type ZoneResult =
  | { ok: true; zone: { code: string; name: string; priceCents: number; costCents: number; freeFromCents: number | null; estimatedDays: string } }
  | { ok: false; error: string }

/**
 * Zona de envío para una dirección. En España se decide por el código postal:
 * las zonas con prefijos (Baleares 07, Canarias 35/38) tienen prioridad sobre la genérica (península).
 */
export async function resolveZone(country: string, postalCode: string): Promise<ZoneResult> {
  const zones = await prisma.shippingZone.findMany({ orderBy: { sortOrder: 'asc' } })
  const cc = country.toUpperCase()
  const cp = postalCode.replace(/\s/g, '')

  if (cc === 'ES') {
    if (!/^\d{5}$/.test(cp)) return { ok: false, error: 'El código postal debe tener 5 cifras.' }
    if (UNSERVED_ES_PREFIXES.some((p) => cp.startsWith(p))) return { ok: false, error: 'Por ahora no enviamos a Ceuta ni Melilla.' }
    const specific = zones.find((z) => z.countries.includes('ES') && z.postalPrefixes.some((p) => cp.startsWith(p)))
    const zone = specific ?? zones.find((z) => z.countries.includes('ES') && z.postalPrefixes.length === 0)
    if (!zone) return { ok: false, error: 'No hay envíos configurados para esta dirección.' }
    if (!zone.active) return { ok: false, error: `Por ahora no enviamos a ${zone.name}. ¡Muy pronto!` }
    return { ok: true, zone }
  }

  const zone = zones.find((z) => z.countries.includes(cc))
  if (!zone || !zone.active) return { ok: false, error: 'Por ahora no enviamos a este país.' }
  if (cp.length < 3) return { ok: false, error: 'Revisa el código postal.' }
  return { ok: true, zone }
}

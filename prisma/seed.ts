// Datos de prueba: el catálogo de la landing (src/data/products.ts), los colores de la marca,
// las zonas de envío y la configuración básica.
//
//   npm run db:seed
//
// Es idempotente: colores, zonas y ajustes se crean si faltan, y los productos solo se
// crean si no existe ya uno con el mismo slug (no pisa lo que se haya editado en el admin).

import 'dotenv/config'
import { createPrismaClient } from '../src/server/db'
import { PRODUCTS, type Product } from '../src/data/products'
import { PALETTE, PALETTE_ORDER } from '../src/data/palette'
import { slugify, skuFor, productCode } from '../src/lib/catalog'

const prisma = createPrismaClient()

const COLOR_CODES = { offwhite: 'OFW', sand: 'SND', sage: 'SGE', blue: 'BLU', black: 'BLK' } as const

const SIZES = ['XS', 'S', 'M', 'L', 'XL']

type Kind = 'tee' | 'shirt' | 'pants' | 'dress' | 'knit' | 'sweatshirt'

function kindOf(p: Product): Kind {
  const n = p.name.toLowerCase()
  if (n.includes('sweatshirt')) return 'sweatshirt'
  if (n.includes('shirt') && !n.includes('t-shirt')) return 'shirt'
  if (n.includes('pants')) return 'pants'
  if (n.includes('dress')) return 'dress'
  if (n.includes('knit')) return 'knit'
  return 'tee'
}

const TEXTS: Record<Kind, { description: string; composition: string; care: string }> = {
  tee: {
    description:
      'Camiseta de corte relajado en algodón orgánico de gramaje medio, teñida en prenda para conseguir ese aspecto lavado y suave desde el primer día. Pensada para vivir despacio: sol, sal y muchas lavadoras.',
    composition: '100 % algodón orgánico certificado GOTS · 220 g/m² · Teñido en prenda',
    care: 'Lavar a 30 °C del revés · No usar lejía · Secar a la sombra · Planchar a temperatura baja sin tocar el estampado',
  },
  shirt: {
    description:
      'Camisa de lino lavado con caída suave y cuello camisero. Fresca en verano, perfecta abierta sobre una camiseta o sola al atardecer.',
    composition: '100 % lino europeo · Lavado a la piedra',
    care: 'Lavar a 30 °C · Secar colgada · El lino luce mejor con sus arrugas naturales',
  },
  pants: {
    description: 'Pantalón ancho de lino con cintura elástica y cordón. Ligero, cómodo y con la caída justa para días sin prisa.',
    composition: '100 % lino europeo · Lavado a la piedra',
    care: 'Lavar a 30 °C · Secar colgado · Planchar a temperatura media si se desea',
  },
  dress: {
    description: 'Vestido midi de lino con tirantes finos y falda con vuelo. Para paseos junto al mar y cenas largas bajo las estrellas.',
    composition: '100 % lino europeo · Forro 100 % algodón',
    care: 'Lavar a 30 °C · Secar colgado · Planchar del revés a temperatura media',
  },
  knit: {
    description: 'Top de punto canalé de manga corta y escote barco. Suave, transpirable y fácil de combinar.',
    composition: '70 % algodón orgánico · 30 % lino',
    care: 'Lavar a mano o a 30 °C en programa delicado · Secar en horizontal',
  },
  sweatshirt: {
    description: 'Sudadera de cuello redondo en felpa de algodón orgánico, teñida en prenda. Para las mañanas frescas y las noches de verano.',
    composition: '100 % algodón orgánico certificado GOTS · Felpa perchada 330 g/m²',
    care: 'Lavar a 30 °C del revés · No usar secadora · Secar en horizontal',
  },
}

const GUIDES: Record<Kind, { columns: string[]; rows: string[][] }> = {
  tee: {
    columns: ['Talla', 'Ancho de pecho (cm)', 'Largo (cm)'],
    rows: [['XS', '50', '68'], ['S', '53', '70'], ['M', '56', '72'], ['L', '59', '74'], ['XL', '62', '76']],
  },
  sweatshirt: {
    columns: ['Talla', 'Ancho de pecho (cm)', 'Largo (cm)', 'Manga (cm)'],
    rows: [['XS', '53', '66', '58'], ['S', '56', '68', '60'], ['M', '59', '70', '62'], ['L', '62', '72', '64'], ['XL', '65', '74', '66']],
  },
  shirt: {
    columns: ['Talla', 'Ancho de pecho (cm)', 'Largo (cm)'],
    rows: [['XS', '54', '72'], ['S', '57', '74'], ['M', '60', '76'], ['L', '63', '78'], ['XL', '66', '80']],
  },
  pants: {
    columns: ['Talla', 'Cintura relajada (cm)', 'Cadera (cm)', 'Largo (cm)'],
    rows: [['XS', '64', '96', '100'], ['S', '68', '100', '102'], ['M', '72', '104', '104'], ['L', '76', '108', '106'], ['XL', '80', '112', '108']],
  },
  dress: {
    columns: ['Talla', 'Pecho (cm)', 'Largo (cm)'],
    rows: [['XS', '80', '118'], ['S', '84', '120'], ['M', '88', '122'], ['L', '92', '124'], ['XL', '96', '126']],
  },
  knit: {
    columns: ['Talla', 'Ancho de pecho (cm)', 'Largo (cm)'],
    rows: [['XS', '46', '52'], ['S', '48', '54'], ['M', '50', '56'], ['L', '52', '58'], ['XL', '54', '60']],
  },
}

// Las prendas de lino y punto se venden con stock propio; el resto, bajo demanda.
const OWN_STOCK: Kind[] = ['shirt', 'pants', 'dress', 'knit']

async function seedColors() {
  for (const [i, key] of PALETTE_ORDER.entries()) {
    const { name, hex } = PALETTE[key]
    await prisma.color.upsert({
      where: { key },
      update: {},
      create: { key, name, hex, code: COLOR_CODES[key], sortOrder: i },
    })
  }
}

async function seedShippingZones() {
  const EU = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'SE']
  const zones = [
    // Ceuta (51) y Melilla (52) quedan fuera de todas las zonas hasta decidir cómo tratarlas.
    { code: 'PENINSULA', name: 'España peninsular', active: true, priceCents: 495, freeFromCents: 6000, countries: ['ES'], postalPrefixes: [], estimatedDays: '2–4 días laborables', sortOrder: 0 },
    { code: 'BALEARES', name: 'Islas Baleares', active: true, priceCents: 795, freeFromCents: 9000, countries: ['ES'], postalPrefixes: ['07'], estimatedDays: '3–5 días laborables', sortOrder: 1 },
    { code: 'CANARIAS', name: 'Islas Canarias', active: false, priceCents: 1295, freeFromCents: null, countries: ['ES'], postalPrefixes: ['35', '38'], estimatedDays: '5–8 días laborables', sortOrder: 2 },
    { code: 'UE', name: 'Unión Europea', active: false, priceCents: 1495, freeFromCents: null, countries: EU, postalPrefixes: [], estimatedDays: '5–10 días laborables', sortOrder: 3 },
  ]
  for (const z of zones) await prisma.shippingZone.upsert({ where: { code: z.code }, update: {}, create: z })
}

async function seedSettings() {
  const settings: Record<string, unknown> = {
    vatRateBp: 2100,
    company: {
      legalName: 'REVISAR — Razón social S.L.',
      taxId: 'REVISAR — NIF',
      address: 'REVISAR — Dirección fiscal',
      email: 'hola@kaeo.example',
      phone: '',
    },
  }
  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({ where: { key }, update: {}, create: { key, value: value as object } })
  }
}

async function seedProducts() {
  const colors = new Map((await prisma.color.findMany()).map((c) => [c.key, c]))
  let created = 0
  for (const [i, p] of PRODUCTS.entries()) {
    const slug = slugify(p.name)
    if (await prisma.product.findUnique({ where: { slug } })) continue

    const kind = kindOf(p)
    const code = productCode(i + 1)
    const ownStock = OWN_STOCK.includes(kind)
    const mainColor = colors.get(p.color)!

    await prisma.product.create({
      data: {
        code,
        slug,
        name: p.name,
        category: p.category === 'hombre' ? 'HOMBRE' : 'MUJER',
        status: 'PUBLISHED',
        stockMode: ownStock ? 'OWN_STOCK' : 'ON_DEMAND',
        priceCents: Math.round(p.price * 100),
        sizes: SIZES,
        sizeGuide: GUIDES[kind],
        ...TEXTS[kind],
        sortOrder: i,
        variants: {
          create: p.colors.flatMap((ck, ci) =>
            SIZES.map((size, si) => ({
              sku: skuFor(code, colors.get(ck)!.code, size),
              size,
              colorId: colors.get(ck)!.id,
              // Stock de ejemplo: algunas variantes quedan bajas para ver las alertas del inventario
              stock: ownStock ? [8, 12, 15, 6, 2][(si + ci) % 5] : 0,
            })),
          ),
        },
        images: { create: [{ url: p.image, alt: p.alt, colorId: mainColor.id, sortOrder: 0 }] },
      },
    })
    created++
  }
  return created
}

async function seedDiscounts() {
  // Código de ejemplo (se puede editar o desactivar desde el admin)
  await prisma.discountCode.upsert({
    where: { code: 'SLOWCLUB10' },
    update: {},
    create: { code: 'SLOWCLUB10', type: 'PERCENT', value: 1000, description: '10 % de bienvenida para la newsletter (ejemplo)' },
  })
}

async function main() {
  await seedColors()
  await seedShippingZones()
  await seedSettings()
  await seedDiscounts()
  const created = await seedProducts()
  const [products, variants] = await Promise.all([prisma.product.count(), prisma.variant.count()])
  console.log(`Seed completado: ${created} productos nuevos (${products} en total, ${variants} variantes).`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

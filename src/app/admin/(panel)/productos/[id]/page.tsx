import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/server/db'
import { centsToInput, sizeGuideToText } from '@/lib/catalog'
import ProductForm from '../ProductForm'
import VariantsForm from '../VariantsForm'
import ImagesManager from '../ImagesManager'
import DeleteProductButton from '../DeleteProductButton'

export const metadata = { title: 'Editar producto' }

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ creado?: string }>
}) {
  const { id } = await params
  const { creado } = await searchParams
  const [product, colors] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        variants: { include: { color: true }, orderBy: [{ active: 'desc' }, { color: { sortOrder: 'asc' } }] },
        images: { orderBy: { sortOrder: 'asc' } },
      },
    }),
    prisma.color.findMany({ orderBy: { sortOrder: 'asc' } }),
  ])
  if (!product) notFound()

  // Variantes en el orden de las tallas del producto
  const sizeIndex = (s: string) => {
    const i = product.sizes.indexOf(s)
    return i === -1 ? 999 : i
  }
  const variants = [...product.variants].sort(
    (a, b) => Number(b.active) - Number(a.active) || a.color.sortOrder - b.color.sortOrder || sizeIndex(a.size) - sizeIndex(b.size),
  )
  const activeColorIds = [...new Set(product.variants.filter((v) => v.active).map((v) => v.colorId))]

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/admin/productos" className="text-[10px] uppercase tracking-[0.2em] text-washed-black/60 hover:text-washed-black">
            ← Productos
          </Link>
          <h1 className="admin-h1 mt-4">{product.name}</h1>
          <p className="mt-2 text-sm text-washed-black/60">
            {product.code} · {product.status === 'PUBLISHED' ? 'Publicado' : 'Borrador'}
          </p>
        </div>
        <DeleteProductButton productId={product.id} name={product.name} />
      </header>

      {creado && <p className="alert-ok">Producto creado. Ahora sube sus fotos y revisa las variantes.</p>}

      <ProductForm
        productId={product.id}
        colors={colors}
        initial={{
          name: product.name,
          slug: product.slug,
          category: product.category,
          status: product.status,
          stockMode: product.stockMode,
          price: centsToInput(product.priceCents),
          vatRate: product.vatRateBp == null ? '' : String(product.vatRateBp / 100).replace('.', ','),
          description: product.description,
          composition: product.composition,
          care: product.care,
          sizes: product.sizes.join(', '),
          colorIds: activeColorIds,
          sizeGuide: sizeGuideToText(product.sizeGuide),
          providerRef: product.providerRef ?? '',
          seoTitle: product.seoTitle ?? '',
          seoDescription: product.seoDescription ?? '',
          showOnHome: product.showOnHome,
          sortOrder: product.sortOrder,
        }}
      />

      <ImagesManager
        productId={product.id}
        colors={colors.filter((c) => activeColorIds.includes(c.id))}
        images={product.images.map((i) => ({ id: i.id, url: i.thumbUrl ?? i.url, alt: i.alt, colorId: i.colorId }))}
      />

      <VariantsForm
        productId={product.id}
        stockMode={product.stockMode}
        basePrice={product.priceCents}
        variants={variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          size: v.size,
          color: { name: v.color.name, hex: v.color.hex },
          price: centsToInput(v.priceCents),
          stock: v.stock,
          threshold: v.lowStockThreshold,
          providerRef: v.providerRef ?? '',
          active: v.active,
        }))}
      />
    </div>
  )
}

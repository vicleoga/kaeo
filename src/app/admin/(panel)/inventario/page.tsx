import Link from 'next/link'
import { prisma } from '@/server/db'
import InventoryForm from './InventoryForm'

export const metadata = { title: 'Inventario' }

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ bajo?: string }> }) {
  const { bajo } = await searchParams
  const products = await prisma.product.findMany({
    where: { stockMode: 'OWN_STOCK' },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: { variants: { where: { active: true }, include: { color: true } } },
  })

  const groups = products
    .map((p) => {
      const sizeIndex = (s: string) => (p.sizes.indexOf(s) + 1 || 999)
      const variants = p.variants
        .filter((v) => !bajo || v.stock <= v.lowStockThreshold)
        .sort((a, b) => a.color.sortOrder - b.color.sortOrder || sizeIndex(a.size) - sizeIndex(b.size))
        .map((v) => ({ id: v.id, sku: v.sku, size: v.size, colorName: v.color.name, colorHex: v.color.hex, stock: v.stock, threshold: v.lowStockThreshold }))
      return { id: p.id, name: p.name, status: p.status, variants }
    })
    .filter((g) => g.variants.length > 0)

  const lowCount = products.flatMap((p) => p.variants).filter((v) => v.stock <= v.lowStockThreshold).length

  return (
    <div className="space-y-8">
      <header>
        <h1 className="admin-h1">Inventario</h1>
        <p className="mt-2 max-w-2xl text-sm text-washed-black/60">
          Stock por variante de los productos con <strong className="font-medium">stock propio</strong>. Los productos bajo demanda no
          tienen límite y no aparecen aquí. El aviso de cada variante se ajusta en la ficha del producto.
        </p>
      </header>

      <nav className="flex gap-2" aria-label="Filtro">
        <Link href="/admin/inventario" className={!bajo ? 'btn-primary' : 'btn-secondary'} aria-current={!bajo ? 'page' : undefined}>
          Todo
        </Link>
        <Link href="/admin/inventario?bajo=1" className={bajo ? 'btn-primary' : 'btn-secondary'} aria-current={bajo ? 'page' : undefined}>
          Stock bajo ({lowCount})
        </Link>
      </nav>

      {groups.length === 0 ? (
        <p className="admin-card text-sm text-washed-black/60">
          {bajo ? 'Ninguna variante por debajo de su aviso de stock.' : 'No hay productos con stock propio.'}
        </p>
      ) : (
        <InventoryForm groups={groups} />
      )}
    </div>
  )
}

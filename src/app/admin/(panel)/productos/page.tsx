import Link from 'next/link'
import { prisma } from '@/server/db'
import { formatCents } from '@/lib/catalog'
import DeleteProductButton from './DeleteProductButton'
import type { Prisma } from '@/generated/prisma/client'

export const metadata = { title: 'Productos' }

const STATUS = { PUBLISHED: 'Publicado', DRAFT: 'Borrador' } as const
const STOCK = { ON_DEMAND: 'Bajo demanda', OWN_STOCK: 'Stock propio' } as const

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string; estado?: string; borrado?: string }>
}) {
  const { q = '', categoria = '', estado = '', borrado } = await searchParams
  const where: Prisma.ProductWhereInput = {
    ...(q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { code: { contains: q, mode: 'insensitive' } }, { variants: { some: { sku: { contains: q, mode: 'insensitive' } } } }] } : {}),
    ...(categoria === 'HOMBRE' || categoria === 'MUJER' ? { category: categoria } : {}),
    ...(estado === 'PUBLISHED' || estado === 'DRAFT' ? { status: estado } : {}),
  }
  const products = await prisma.product.findMany({
    where,
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    include: {
      images: { orderBy: { sortOrder: 'asc' }, take: 1 },
      variants: { where: { active: true }, select: { stock: true, lowStockThreshold: true } },
    },
  })

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="admin-h1">Productos</h1>
          <p className="mt-2 text-sm text-washed-black/60">{products.length} productos</p>
        </div>
        <Link href="/admin/productos/nuevo" className="btn-primary">
          + Nuevo producto
        </Link>
      </header>

      {borrado && <p className="alert-ok">Producto eliminado.</p>}

      <form className="flex flex-wrap items-end gap-3" role="search">
        <div className="min-w-[200px] flex-1">
          <label htmlFor="q" className="field-label">
            Buscar
          </label>
          <input id="q" name="q" defaultValue={q} placeholder="Nombre, código o SKU" className="input" />
        </div>
        <div>
          <label htmlFor="categoria" className="field-label">
            Categoría
          </label>
          <select id="categoria" name="categoria" defaultValue={categoria} className="input">
            <option value="">Todas</option>
            <option value="HOMBRE">Hombre</option>
            <option value="MUJER">Mujer</option>
          </select>
        </div>
        <div>
          <label htmlFor="estado" className="field-label">
            Estado
          </label>
          <select id="estado" name="estado" defaultValue={estado} className="input">
            <option value="">Todos</option>
            <option value="PUBLISHED">Publicados</option>
            <option value="DRAFT">Borradores</option>
          </select>
        </div>
        <button type="submit" className="btn-secondary py-2.5">
          Filtrar
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="admin-table min-w-[500px]">
          <thead>
            <tr>
              <th className="w-16">Foto</th>
              <th>Producto</th>
              <th>Precio</th>
              <th>Stock</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const low = p.stockMode === 'OWN_STOCK' && p.variants.some((v) => v.stock <= v.lowStockThreshold)
              const total = p.variants.reduce((n, v) => n + v.stock, 0)
              const img = p.images[0]
              const href = `/admin/productos/${p.id}`
              return (
                <tr key={p.id} className="hover:bg-white/60">
                  <td>
                    <Link href={href} tabIndex={-1} aria-hidden="true">
                      {img ? <img src={img.thumbUrl ?? img.url} alt="" className="h-14 w-11 object-cover" /> : <span className="block h-14 w-11 bg-sand/40" />}
                    </Link>
                  </td>
                  <td>
                    <Link href={href} className="font-medium underline decoration-washed-black/20 underline-offset-4 hover:decoration-washed-black">
                      {p.name}
                    </Link>
                    <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-washed-black/55">
                      <span className={`badge ${p.status === 'PUBLISHED' ? 'bg-sage/25 text-washed-black' : 'bg-washed-black/5 text-washed-black/60'}`}>{STATUS[p.status]}</span>
                      {p.category === 'HOMBRE' ? 'Hombre' : 'Mujer'} · {p.code} · {p.variants.length} variantes
                    </span>
                  </td>
                  <td className="tabular-nums">{formatCents(p.priceCents)}</td>
                  <td className="text-xs">
                    {STOCK[p.stockMode]}
                    {p.stockMode === 'OWN_STOCK' && (
                      <span className={`block tabular-nums ${low ? 'text-terracotta' : 'text-washed-black/55'}`}>
                        {total} uds.{low ? ' · stock bajo' : ''}
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="flex justify-end gap-2">
                      <Link href={href} className="btn-secondary px-3 py-1.5">
                        Editar
                      </Link>
                      <DeleteProductButton productId={p.id} name={p.name} compact />
                    </div>
                  </td>
                </tr>
              )
            })}
            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-washed-black/60">
                  No hay productos con esos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

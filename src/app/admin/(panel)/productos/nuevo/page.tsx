import Link from 'next/link'
import { prisma } from '@/server/db'
import ProductForm from '../ProductForm'

export const metadata = { title: 'Nuevo producto' }

export default async function NewProductPage() {
  const colors = await prisma.color.findMany({ orderBy: { sortOrder: 'asc' } })
  return (
    <div className="space-y-8">
      <header>
        <Link href="/admin/productos" className="text-[10px] uppercase tracking-[0.2em] text-washed-black/60 hover:text-washed-black">
          ← Productos
        </Link>
        <h1 className="admin-h1 mt-4">Nuevo producto</h1>
        <p className="mt-2 text-sm text-washed-black/60">
          Al guardar se crean las variantes (talla × color) con su SKU. Después podrás subir las fotos.
        </p>
      </header>
      <ProductForm productId={null} colors={colors} />
    </div>
  )
}

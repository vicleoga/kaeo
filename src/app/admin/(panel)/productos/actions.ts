'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/server/db'
import { requireAdmin } from '@/server/auth'
import { nextProductCode, syncVariants } from '@/server/products'
import { deleteStoredImage } from '@/server/images'
import { addProductImages as addImages, MAX_FILES_PER_UPLOAD as MAX_FILES } from '@/server/productImages'
import { fieldErrors, productFormData, productSchema } from '@/lib/validation/product'
import { parseEuros, slugify } from '@/lib/catalog'
import { Prisma } from '@/generated/prisma/client'

// Todas las acciones empiezan con requireAdmin(): una server action es un endpoint público
// aunque solo se use desde páginas protegidas. La protección CSRF la aplica Next.js
// (comprueba que el Origin de la petición coincide con el Host) y la cookie es SameSite=Lax.

export interface FormState {
  ok?: string
  error?: string
  fields?: Record<string, string>
  /** Lo enviado, para que el formulario no pierda lo escrito si hay errores */
  values?: Record<string, unknown>
}

const refresh = (productId?: string) => {
  revalidatePath('/', 'layout')
  revalidatePath('/admin/productos')
  if (productId) revalidatePath(`/admin/productos/${productId}`)
}

// ───────────── Producto ─────────────

export async function saveProduct(productId: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin()
  const raw = productFormData(formData)
  // (las fotos no se devuelven en `values`: un <input type=file> no se puede rellenar de nuevo)
  const parsed = productSchema.safeParse(raw)
  if (!parsed.success) return { error: 'Revisa los campos marcados.', fields: fieldErrors(parsed.error), values: raw }
  const { price, cost, vatRate, colorIds, sizes, sizeGuide, ...data } = parsed.data
  const slug = data.slug || slugify(data.name)

  const clash = await prisma.product.findFirst({ where: { slug, NOT: productId ? { id: productId } : undefined }, select: { id: true } })
  if (clash) return { error: 'Revisa los campos marcados.', fields: { slug: 'Ya hay otro producto con esta URL' }, values: raw }

  const values = {
    ...data,
    slug,
    sizes,
    priceCents: price,
    costCents: cost,
    vatRateBp: vatRate,
    sizeGuide: sizeGuide ?? Prisma.DbNull,
  }

  let id = productId
  try {
    await prisma.$transaction(async (tx) => {
      if (id) {
        await tx.product.update({ where: { id }, data: values })
      } else {
        const created = await tx.product.create({ data: { ...values, code: await nextProductCode(tx) } })
        id = created.id
      }
      await syncVariants(tx, id!, sizes, colorIds)
    })
  } catch (e) {
    console.error('saveProduct', e)
    return { error: 'No se ha podido guardar. Inténtalo de nuevo.', values: raw }
  }

  // Fotos subidas en el mismo formulario de alta (el texto alternativo por defecto es el nombre)
  let photoProblems = 0
  if (!productId) {
    const files = formData.getAll('files').filter((f): f is File => f instanceof File && f.size > 0).slice(0, MAX_FILES)
    photoProblems = (await addImages(id!, files, null, data.name)).length
  }

  refresh(id!)
  if (!productId) redirect(`/admin/productos/${id}?creado=1${photoProblems ? `&fotosFallidas=${photoProblems}` : ''}`)
  return { ok: 'Producto guardado.' }
}


export async function deleteProduct(productId: string) {
  await requireAdmin()
  const images = await prisma.productImage.findMany({ where: { productId }, select: { storageKeys: true } })
  await prisma.product.delete({ where: { id: productId } })
  await deleteStoredImage(images.flatMap((i) => i.storageKeys)).catch((e) => console.error('deleteProduct: fotos', e))
  refresh()
  redirect('/admin/productos?borrado=1')
}

// ───────────── Variantes ─────────────

/** Guarda la tabla de variantes. Campos: v.<id>.sku, v.<id>.price, v.<id>.stock… */
export async function saveVariants(productId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin()
  const variants = await prisma.variant.findMany({ where: { productId } })
  const errors: Record<string, string> = {}
  const updates: { id: string; data: Prisma.VariantUpdateInput }[] = []
  const skus = new Set<string>()

  for (const v of variants) {
    const f = (name: string) => String(formData.get(`v.${v.id}.${name}`) ?? '').trim()
    if (!formData.has(`v.${v.id}.sku`)) continue
    const sku = f('sku').toUpperCase()
    const priceText = f('price')
    const price = priceText ? parseEuros(priceText) : null
    const costText = f('cost')
    const cost = costText ? parseEuros(costText) : null
    const stock = Number(f('stock') || '0')
    const threshold = Number(f('threshold') || '0')

    if (!/^[A-Z0-9][A-Z0-9-]{1,40}$/.test(sku)) errors[v.id] = `SKU no válido: "${sku}"`
    else if (skus.has(sku)) errors[v.id] = `SKU repetido: ${sku}`
    else if (priceText && (price == null || price <= 0)) errors[v.id] = `Precio no válido en ${sku}`
    else if (costText && cost == null) errors[v.id] = `Coste no válido en ${sku}`
    else if (!Number.isInteger(stock) || stock < 0 || stock > 1_000_000) errors[v.id] = `Stock no válido en ${sku}`
    else if (!Number.isInteger(threshold) || threshold < 0 || threshold > 10_000) errors[v.id] = `Aviso de stock no válido en ${sku}`
    skus.add(sku)

    updates.push({
      id: v.id,
      data: {
        sku,
        priceCents: price,
        costCents: cost,
        stock,
        lowStockThreshold: threshold,
        providerRef: f('providerRef') || null,
        active: formData.get(`v.${v.id}.active`) === 'on',
      },
    })
  }
  if (Object.keys(errors).length) return { error: Object.values(errors)[0], fields: errors }

  const clash = await prisma.variant.findFirst({
    where: { sku: { in: [...skus] }, productId: { not: productId } },
    select: { sku: true },
  })
  if (clash) return { error: `El SKU ${clash.sku} ya lo usa otro producto.` }

  try {
    await prisma.$transaction(async (tx) => {
      // Primero SKU temporales para poder intercambiar SKU entre variantes sin chocar con el índice único.
      for (const u of updates) await tx.variant.update({ where: { id: u.id }, data: { sku: `TMP-${u.id}` } })
      for (const u of updates) await tx.variant.update({ where: { id: u.id }, data: u.data })
    })
  } catch (e) {
    console.error('saveVariants', e)
    return { error: 'No se han podido guardar las variantes.' }
  }
  refresh(productId)
  return { ok: 'Variantes guardadas.' }
}

// ───────────── Fotos ─────────────


export async function updateImage(imageId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin()
  const alt = String(formData.get('alt') ?? '').trim().slice(0, 300)
  const colorId = String(formData.get('colorId') ?? '') || null
  const img = await prisma.productImage.update({ where: { id: imageId }, data: { alt, colorId } })
  refresh(img.productId)
  return { ok: 'Guardado' }
}

export async function moveImage(imageId: string, direction: 'up' | 'down') {
  await requireAdmin()
  const img = await prisma.productImage.findUniqueOrThrow({ where: { id: imageId } })
  const all = await prisma.productImage.findMany({ where: { productId: img.productId }, orderBy: { sortOrder: 'asc' } })
  const i = all.findIndex((x) => x.id === imageId)
  const j = direction === 'up' ? i - 1 : i + 1
  if (j < 0 || j >= all.length) return
  ;[all[i], all[j]] = [all[j], all[i]]
  await prisma.$transaction(all.map((x, n) => prisma.productImage.update({ where: { id: x.id }, data: { sortOrder: n } })))
  refresh(img.productId)
}

export async function deleteImage(imageId: string) {
  await requireAdmin()
  const img = await prisma.productImage.delete({ where: { id: imageId } })
  await deleteStoredImage(img.storageKeys).catch((e) => console.error('deleteImage', e))
  refresh(img.productId)
}

import 'server-only'
import { prisma } from './db'
import { ImageError, storeProductImage } from './images'

export const MAX_FILES_PER_UPLOAD = 12

/** Procesa y guarda fotos de un producto (al final de su galería). Devuelve los mensajes de las que fallan. */
export async function addProductImages(productId: string, files: File[], colorId: string | null, defaultAlt = '') {
  const last = await prisma.productImage.findFirst({ where: { productId }, orderBy: { sortOrder: 'desc' } })
  let order = (last?.sortOrder ?? -1) + 1
  const problems: string[] = []
  for (const file of files) {
    try {
      const stored = await storeProductImage(file, productId)
      await prisma.productImage.create({ data: { productId, ...stored, colorId, alt: defaultAlt, sortOrder: order++ } })
    } catch (e) {
      if (e instanceof ImageError) problems.push(e.message)
      else {
        console.error('addProductImages', e)
        problems.push(`${file.name}: error al guardar.`)
      }
    }
  }
  return problems
}

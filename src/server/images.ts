import 'server-only'
import { randomUUID } from 'node:crypto'
import sharp from 'sharp'
import { getStorage } from './storage'

export const MAX_IMAGE_BYTES = 15 * 1024 * 1024
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

export class ImageError extends Error {}

/**
 * Valida una foto subida y guarda dos versiones WebP: 1600 px (ficha) y 600 px (miniaturas).
 * sharp decodifica la imagen, así que un fichero que no sea realmente una imagen se rechaza
 * aunque tenga la extensión correcta. Se eliminan los metadatos EXIF (GPS, cámara…).
 */
export async function storeProductImage(file: File, productId: string) {
  if (!ACCEPTED.includes(file.type)) throw new ImageError(`${file.name}: formato no admitido (usa JPG, PNG, WebP o AVIF).`)
  if (file.size > MAX_IMAGE_BYTES) throw new ImageError(`${file.name}: supera los 15 MB.`)

  const input = Buffer.from(await file.arrayBuffer())
  let large: Buffer
  let thumb: Buffer
  try {
    const base = sharp(input, { limitInputPixels: 60_000_000 }).rotate()
    large = await base.clone().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer()
    thumb = await base.clone().resize({ width: 600, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer()
  } catch {
    throw new ImageError(`${file.name}: no se ha podido leer la imagen.`)
  }

  const storage = getStorage()
  const id = randomUUID()
  const keys = [`products/${productId}/${id}-1600.webp`, `products/${productId}/${id}-600.webp`]
  await storage.put(keys[0], large, 'image/webp')
  await storage.put(keys[1], thumb, 'image/webp')
  return { url: storage.publicUrl(keys[0]), thumbUrl: storage.publicUrl(keys[1]), storageKeys: keys }
}

export async function deleteStoredImage(storageKeys: string[]) {
  const storage = getStorage()
  await Promise.all(storageKeys.map((k) => storage.delete(k)))
}

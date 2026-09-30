// Reducción de fotos en el navegador antes de subirlas (solo cliente).

export const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
export const MAX_SIDE = 2400 // la tienda guarda como máximo 1600 px: no hace falta subir más

/**
 * Reduce la foto en el navegador antes de subirla (móvil: 5–20 MB → ~0,5–2 MB). Así sube mucho
 * más rápido y el servidor trabaja menos. Si no se puede decodificar, se envía la original.
 */
export async function prepareImage(file: File): Promise<File> {
  if (!ACCEPTED.includes(file.type)) return file
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height))
    if (scale === 1 && file.size < 2.5 * 1024 * 1024) {
      bmp.close()
      return file
    }
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bmp.width * scale)
    canvas.height = Math.round(bmp.height * scale)
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
    bmp.close()
    // PNG (puede tener transparencia) → WebP; el resto → JPEG de alta calidad
    const type = file.type === 'image/png' ? 'image/webp' : 'image/jpeg'
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, type, 0.9))
    if (!blob || blob.size >= file.size) return file
    const ext = blob.type === 'image/webp' ? 'webp' : blob.type === 'image/png' ? 'png' : 'jpg'
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.' + ext, { type: blob.type })
  } catch {
    return file
  }
}

export const formatBytes = (b: number) =>
  b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1).replace('.', ',')} MB` : `${Math.max(1, Math.round(b / 1024))} KB`

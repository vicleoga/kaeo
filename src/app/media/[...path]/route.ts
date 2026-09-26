import { readLocalFile } from '@/server/storage/local'

// Sirve las fotos subidas desde el admin (almacenamiento local).
// Los nombres llevan un UUID, así que el contenido de una URL nunca cambia → caché de 1 año.
const TYPES: Record<string, string> = { webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', avif: 'image/avif' }

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const key = path.join('/')
  const type = TYPES[key.split('.').pop()?.toLowerCase() ?? '']
  if (!type) return new Response('No encontrado', { status: 404 })
  try {
    const data = await readLocalFile(key)
    return new Response(new Uint8Array(data), {
      headers: {
        'Content-Type': type,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return new Response('No encontrado', { status: 404 })
  }
}

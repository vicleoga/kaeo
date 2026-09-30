import { revalidatePath } from 'next/cache'
import { prisma } from '@/server/db'
import { getCurrentAdmin } from '@/server/auth'
import { addProductImages } from '@/server/productImages'
import { MAX_IMAGE_BYTES } from '@/server/images'

// Subida de UNA foto por petición (el navegador las envía de una en una para poder mostrar
// el progreso de cada una). Al ser una ruta y no una server action, la protección CSRF
// se hace aquí: sesión de administrador + el Origin de la petición debe ser la propia web.

function sameOrigin(req: Request) {
  const origin = req.headers.get('origin')
  if (!origin) return false
  let originHost: string
  try {
    originHost = new URL(origin).host
  } catch {
    return false
  }
  const allowed = new Set<string>()
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
  if (host) allowed.add(host)
  try {
    if (process.env.NEXT_PUBLIC_SITE_URL) allowed.add(new URL(process.env.NEXT_PUBLIC_SITE_URL).host)
  } catch {}
  return allowed.has(originHost)
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(req)) return Response.json({ error: 'Origen no permitido' }, { status: 403 })
  const admin = await getCurrentAdmin()
  if (!admin) return Response.json({ error: 'Tu sesión ha caducado. Vuelve a entrar.' }, { status: 401 })

  const { id } = await params
  const product = await prisma.product.findUnique({ where: { id }, select: { id: true } })
  if (!product) return Response.json({ error: 'Producto no encontrado' }, { status: 404 })

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return Response.json({ error: 'Envío no válido' }, { status: 400 })
  }
  const file = form.get('file')
  if (!(file instanceof File) || file.size === 0) return Response.json({ error: 'No se ha recibido ninguna foto' }, { status: 400 })
  if (file.size > MAX_IMAGE_BYTES) return Response.json({ error: `${file.name}: supera los 15 MB` }, { status: 413 })

  const colorId = String(form.get('colorId') ?? '') || null
  const alt = String(form.get('alt') ?? '').slice(0, 300)
  const problems = await addProductImages(id, [file], colorId, alt)
  if (problems.length) return Response.json({ error: problems[0] }, { status: 422 })

  revalidatePath(`/admin/productos/${id}`)
  revalidatePath('/', 'layout')
  return Response.json({ ok: true })
}

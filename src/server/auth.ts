import 'server-only'
import { createHash, randomBytes } from 'node:crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from './db'
import { clientIp, userAgent } from './request'

const COOKIE = 'kaeo_admin'
const SESSION_HOURS = 12

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')

// La cookie solo viaja por HTTPS cuando la web se sirve con HTTPS (producción).
const secureCookie = () => (process.env.NEXT_PUBLIC_SITE_URL ?? '').startsWith('https://')

/** Crea una sesión y deja la cookie en el navegador. El token en claro solo vive en la cookie. */
export async function createSession(userId: string) {
  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 3600_000)
  await prisma.session.create({
    data: { id: hashToken(token), userId, expiresAt, ip: await clientIp(), userAgent: await userAgent() },
  })
  const jar = await cookies()
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: secureCookie(),
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  })
}

/** Usuario admin de la sesión actual, o null. */
export async function getCurrentAdmin() {
  const token = (await cookies()).get(COOKIE)?.value
  if (!token) return null
  const session = await prisma.session.findUnique({
    where: { id: hashToken(token) },
    include: { user: { select: { id: true, email: true, name: true } } },
  })
  if (!session || session.expiresAt < new Date()) return null
  return session.user
}

/**
 * Exige sesión de administración. Se llama en el layout del panel Y al principio de cada
 * server action del admin (las acciones son endpoints públicos: no basta con el layout).
 */
export async function requireAdmin() {
  const admin = await getCurrentAdmin()
  if (!admin) redirect('/admin/login')
  return admin
}

export async function destroySession() {
  const jar = await cookies()
  const token = jar.get(COOKIE)?.value
  if (token) await prisma.session.deleteMany({ where: { id: hashToken(token) } })
  jar.delete(COOKIE)
  // Limpieza oportunista de sesiones caducadas
  await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } })
}

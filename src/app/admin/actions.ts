'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { prisma } from '@/server/db'
import { createSession, destroySession } from '@/server/auth'
import { hashPassword, verifyPassword } from '@/server/password'
import { consumeRateLimit, resetRateLimit } from '@/server/rateLimit'
import { clientIp } from '@/server/request'

export interface LoginState {
  error?: string
}

// Se entra con el email o con el nombre de usuario.
const loginSchema = z.object({
  login: z.string().trim().toLowerCase().min(3).max(200),
  password: z.string().min(1).max(200),
})

// Hash de relleno: si el email no existe se verifica igualmente contra él, para que el tiempo
// de respuesta no delate qué emails son de administradores.
let dummyHash: Promise<string> | undefined
const getDummyHash = () => (dummyHash ??= hashPassword('kaeo-dummy-password-for-timing'))

const MINUTES = 15

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({ login: formData.get('login'), password: formData.get('password') })
  if (!parsed.success) return { error: 'Introduce tu usuario (o email) y la contraseña.' }
  const { login: identifier, password } = parsed.data

  // Límites: 5 intentos por usuario y 20 por IP cada 15 minutos.
  const ip = await clientIp()
  const [byEmail, byIp] = await Promise.all([
    consumeRateLimit(`login:user:${identifier}`, 5, MINUTES * 60),
    consumeRateLimit(`login:ip:${ip}`, 20, MINUTES * 60),
  ])
  if (!byEmail.ok || !byIp.ok) {
    const wait = Math.ceil(Math.max(byEmail.retryAfterSeconds, byIp.retryAfterSeconds) / 60)
    return { error: `Demasiados intentos. Vuelve a probar dentro de ${wait} minuto${wait === 1 ? '' : 's'}.` }
  }

  const user = await prisma.adminUser.findFirst({ where: identifier.includes('@') ? { email: identifier } : { username: identifier } })
  const valid = user
    ? await verifyPassword(user.passwordHash, password)
    : (await verifyPassword(await getDummyHash(), password), false)
  if (!user || !valid) return { error: 'Usuario o contraseña incorrectos.' }

  await resetRateLimit(`login:user:${identifier}`)
  await prisma.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
  await createSession(user.id)

  // Solo se permite volver a rutas internas del admin (evita redirecciones abiertas).
  const next = String(formData.get('next') ?? '')
  redirect(next.startsWith('/admin') && !next.startsWith('//') ? next : '/admin')
}

export async function logout() {
  await destroySession()
  redirect('/admin/login')
}

import 'server-only'
import { prisma } from './db'

export interface RateLimitResult {
  ok: boolean
  remaining: number
  retryAfterSeconds: number
}

/**
 * Cuenta un intento para `key` en una ventana fija de `windowSeconds`.
 * Atómico en PostgreSQL (INSERT … ON CONFLICT), así que vale con varias instancias de la app.
 */
export async function consumeRateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const rows = await prisma.$queryRaw<{ count: number; resetAt: Date }[]>`
    INSERT INTO rate_limits ("key", "count", "resetAt")
    VALUES (${key}, 1, now() + make_interval(secs => ${windowSeconds}))
    ON CONFLICT ("key") DO UPDATE SET
      "count"   = CASE WHEN rate_limits."resetAt" < now() THEN 1 ELSE rate_limits."count" + 1 END,
      "resetAt" = CASE WHEN rate_limits."resetAt" < now() THEN now() + make_interval(secs => ${windowSeconds}) ELSE rate_limits."resetAt" END
    RETURNING "count", "resetAt"`
  const { count, resetAt } = rows[0]
  return {
    ok: count <= limit,
    remaining: Math.max(0, limit - count),
    retryAfterSeconds: Math.max(0, Math.ceil((resetAt.getTime() - Date.now()) / 1000)),
  }
}

export async function resetRateLimit(key: string) {
  await prisma.rateLimit.deleteMany({ where: { key } })
}

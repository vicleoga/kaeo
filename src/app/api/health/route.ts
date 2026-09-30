import { prisma } from '@/server/db'

// Comprobación de estado para Docker / el proxy: la app responde y llega a la base de datos.
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return Response.json({ status: 'ok', db: 'ok' })
  } catch {
    return Response.json({ status: 'error', db: 'unreachable' }, { status: 503 })
  }
}

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'

// Un único cliente por proceso. En desarrollo se guarda en globalThis para que la
// recarga en caliente de Next no abra una conexión nueva en cada cambio.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Configuración de Prisma 7. Prisma ya no lee .env por sí solo: lo carga dotenv
// (en Docker las variables vienen del entorno y dotenv no hace nada).
import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
})

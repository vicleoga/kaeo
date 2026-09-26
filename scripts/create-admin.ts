// Crea un usuario del panel de administración, o cambia su contraseña si ya existe.
//
//   npm run admin:create -- --email tu@correo.com --name "Tu nombre"
//   npm run admin:create -- --email tu@correo.com --password "una-contraseña-larga"
//
// Sin --password se genera una aleatoria y se muestra UNA sola vez.
// En Docker:  docker compose run --rm migrate npm run admin:create -- --email …

import 'dotenv/config'
import { randomBytes } from 'node:crypto'
import { parseArgs } from 'node:util'
import { createPrismaClient } from '../src/server/db'
import { hashPassword, passwordProblem } from '../src/server/password'

const { values } = parseArgs({
  options: {
    email: { type: 'string' },
    name: { type: 'string' },
    password: { type: 'string' },
  },
})

async function main() {
  const email = values.email?.trim().toLowerCase()
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    console.error('Indica un email válido: npm run admin:create -- --email tu@correo.com')
    process.exit(1)
  }
  const generated = !values.password
  const password = values.password ?? randomBytes(15).toString('base64url')
  const problem = passwordProblem(password)
  if (problem) {
    console.error(problem)
    process.exit(1)
  }

  const prisma = createPrismaClient()
  try {
    const passwordHash = await hashPassword(password)
    const existing = await prisma.adminUser.findUnique({ where: { email } })
    if (existing) {
      await prisma.adminUser.update({ where: { email }, data: { passwordHash, ...(values.name ? { name: values.name } : {}) } })
      await prisma.session.deleteMany({ where: { userId: existing.id } })
      console.log(`Contraseña actualizada para ${email} (sus sesiones abiertas se han cerrado).`)
    } else {
      await prisma.adminUser.create({ data: { email, name: values.name ?? email.split('@')[0], passwordHash } })
      console.log(`Administrador creado: ${email}`)
    }
    if (generated) console.log(`Contraseña generada (guárdala ahora, no se volverá a mostrar): ${password}`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

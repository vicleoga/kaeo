// Crea un usuario del panel de administración, o cambia su contraseña si ya existe.
//
//   npm run admin:create -- --username vleonardo --name "Víctor" --password "…"
//   npm run admin:create -- --email tu@correo.com --name "Tu nombre"
//
// Se entra con el nombre de usuario o con el email (hace falta al menos uno).
// Sin --password se genera una aleatoria y se muestra UNA sola vez.
// En Docker:  docker compose run --rm migrate npm run admin:create -- --username …

import 'dotenv/config'
import { randomBytes } from 'node:crypto'
import { parseArgs } from 'node:util'
import { createPrismaClient } from '../src/server/db'
import { hashPassword, passwordProblem } from '../src/server/password'

const { values } = parseArgs({
  options: {
    email: { type: 'string' },
    username: { type: 'string' },
    name: { type: 'string' },
    password: { type: 'string' },
  },
})

function fail(msg: string): never {
  console.error(msg)
  process.exit(1)
}

async function main() {
  const email = values.email?.trim().toLowerCase() || null
  const username = values.username?.trim().toLowerCase() || null
  if (!email && !username) fail('Indica --username o --email. Ej.: npm run admin:create -- --username vleonardo')
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) fail('Email no válido.')
  if (username && !/^[a-z0-9._-]{3,40}$/.test(username)) fail('Usuario no válido: 3-40 caracteres (letras, números, punto, guion).')

  const generated = !values.password
  const password = values.password ?? randomBytes(15).toString('base64url')
  const problem = passwordProblem(password)
  if (problem) fail(problem)

  const prisma = createPrismaClient()
  try {
    const passwordHash = await hashPassword(password)
    const existing = await prisma.adminUser.findFirst({ where: { OR: [...(email ? [{ email }] : []), ...(username ? [{ username }] : [])] } })
    const label = username ?? email
    if (existing) {
      await prisma.adminUser.update({
        where: { id: existing.id },
        data: { passwordHash, ...(values.name ? { name: values.name } : {}), ...(email ? { email } : {}), ...(username ? { username } : {}) },
      })
      await prisma.session.deleteMany({ where: { userId: existing.id } })
      console.log(`Contraseña actualizada para ${label} (sus sesiones abiertas se han cerrado).`)
    } else {
      await prisma.adminUser.create({ data: { email, username, name: values.name ?? label!, passwordHash } })
      console.log(`Administrador creado: ${label}`)
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

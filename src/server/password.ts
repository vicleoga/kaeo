import { hash, verify } from '@node-rs/argon2'

// argon2id con los parámetros recomendados por OWASP (19 MiB, 2 iteraciones).
const OPTIONS = { memoryCost: 19456, timeCost: 2, parallelism: 1, outputLen: 32 }

export const hashPassword = (password: string) => hash(password, OPTIONS)

export async function verifyPassword(passwordHash: string, password: string) {
  try {
    return await verify(passwordHash, password)
  } catch {
    return false
  }
}

/** Requisitos mínimos de una contraseña de administración. Devuelve el problema o null. */
export function passwordProblem(password: string): string | null {
  if (password.length < 12) return 'La contraseña debe tener al menos 12 caracteres.'
  if (password.length > 200) return 'La contraseña es demasiado larga.'
  return null
}

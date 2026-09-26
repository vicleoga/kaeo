import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { StorageProvider } from './types'

/** Carpeta raíz de las subidas (en Docker, un volumen montado en /app/uploads). */
export const uploadRoot = () => path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'))

/** Ruta absoluta segura para una clave: impide salir de la carpeta de subidas (../). */
export function resolveKey(key: string) {
  const root = uploadRoot()
  const full = path.resolve(root, key)
  if (full !== root && !full.startsWith(root + path.sep)) throw new Error('Clave de almacenamiento no válida')
  return full
}

export const localStorage: StorageProvider = {
  async put(key, data) {
    const file = resolveKey(key)
    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, data)
  },
  async delete(key) {
    await unlink(resolveKey(key)).catch((e: NodeJS.ErrnoException) => {
      if (e.code !== 'ENOENT') throw e
    })
  },
  publicUrl: (key) => `/media/${key}`,
}

export const readLocalFile = (key: string) => readFile(resolveKey(key))

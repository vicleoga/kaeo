import 'server-only'
import { localStorage } from './local'
import type { StorageProvider } from './types'

// Elegido por variable de entorno; por ahora solo existe "local".
export function getStorage(): StorageProvider {
  const provider = process.env.STORAGE_PROVIDER || 'local'
  switch (provider) {
    case 'local':
      return localStorage
    default:
      throw new Error(`STORAGE_PROVIDER desconocido: ${provider}`)
  }
}

export type { StorageProvider }

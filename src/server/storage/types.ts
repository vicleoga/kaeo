/**
 * Almacenamiento de ficheros subidos (fotos de producto).
 * Hoy: disco local (volumen Docker). Mañana: un bucket S3 compatible (p. ej. Hetzner
 * Object Storage) implementando esta misma interfaz, sin tocar el resto del código.
 */
export interface StorageProvider {
  put(key: string, data: Buffer, contentType: string): Promise<void>
  delete(key: string): Promise<void>
  /** URL pública con la que el navegador pide el fichero */
  publicUrl(key: string): string
}

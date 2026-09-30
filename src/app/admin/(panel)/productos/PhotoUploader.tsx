'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { ACCEPTED, formatBytes as fmtBytes, prepareImage } from '@/lib/imageResize'

const MAX_FILES = 12

type Status = 'waiting' | 'preparing' | 'uploading' | 'processing' | 'done' | 'error'

interface Item {
  id: string
  name: string
  originalBytes: number
  sentBytes?: number
  status: Status
  progress: number // 0-100 de la subida
  error?: string
}

/** Sube una foto con XMLHttpRequest (fetch no informa del progreso de subida). */
function upload(url: string, file: File, colorId: string, onProgress: (pct: number) => void, onUploaded: () => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url)
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100))
    xhr.upload.onload = onUploaded // bytes enviados: ahora el servidor procesa
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve()
      let msg = `Error ${xhr.status}`
      try {
        msg = JSON.parse(xhr.responseText).error ?? msg
      } catch {}
      if (xhr.status === 413) msg = 'La foto es demasiado grande'
      reject(new Error(msg))
    }
    xhr.onerror = () => reject(new Error('Sin conexión. Inténtalo de nuevo.'))
    xhr.ontimeout = () => reject(new Error('Ha tardado demasiado. Inténtalo de nuevo.'))
    xhr.timeout = 5 * 60 * 1000
    const body = new FormData()
    body.append('file', file)
    body.append('colorId', colorId)
    xhr.send(body)
  })
}

const STATUS_TEXT: Record<Status, string> = {
  waiting: 'En cola',
  preparing: 'Preparando…',
  uploading: 'Subiendo',
  processing: 'Procesando…',
  done: 'Lista',
  error: 'Error',
}

export default function PhotoUploader({ productId, colors }: { productId: string; colors: { id: string; name: string }[] }) {
  const router = useRouter()
  const input = useRef<HTMLInputElement>(null)
  const [colorId, setColorId] = useState('')
  const [items, setItems] = useState<Item[]>([])
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const patch = (id: string, p: Partial<Item>) => setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...p } : it)))

  const start = async () => {
    const files = [...(input.current?.files ?? [])]
    if (!files.length) return setNotice('Elige al menos una foto.')
    if (files.length > MAX_FILES) return setNotice(`Sube como máximo ${MAX_FILES} fotos a la vez.`)
    setNotice(null)
    const queue: Item[] = files.map((f, i) => ({ id: `${Date.now()}-${i}`, name: f.name, originalBytes: f.size, status: 'waiting', progress: 0 }))
    setItems(queue)
    setBusy(true)

    // De una en una: progreso claro, y el servidor (una Raspberry) no se satura
    for (const [i, file] of files.entries()) {
      const { id } = queue[i]
      try {
        if (!ACCEPTED.includes(file.type)) throw new Error('Formato no admitido (usa JPG, PNG, WebP o AVIF)')
        patch(id, { status: 'preparing' })
        const ready = await prepareImage(file)
        patch(id, { status: 'uploading', sentBytes: ready.size, progress: 0 })
        await upload(
          `/admin/productos/${productId}/fotos`,
          ready,
          colorId,
          (progress) => patch(id, { progress }),
          () => patch(id, { status: 'processing', progress: 100 }),
        )
        patch(id, { status: 'done', progress: 100 })
      } catch (e) {
        patch(id, { status: 'error', error: e instanceof Error ? e.message : 'Error' })
      }
    }

    setBusy(false)
    if (input.current) input.current.value = ''
    router.refresh() // muestra las fotos nuevas en la galería
  }

  const done = items.filter((i) => i.status === 'done').length
  const failed = items.filter((i) => i.status === 'error').length
  // Progreso total: cada foto cuenta igual; subir = 90 % de su parte, procesar = el 10 % final
  const overall = items.length
    ? Math.round(
        (items.reduce((n, i) => n + (i.status === 'done' || i.status === 'error' ? 1 : i.status === 'processing' ? 0.95 : i.status === 'uploading' ? (i.progress / 100) * 0.9 : 0), 0) /
          items.length) *
          100,
      )
    : 0

  return (
    <div className="space-y-4 border-t border-washed-black/10 pt-5">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <label htmlFor="files" className="field-label">
            Subir fotos
          </label>
          <input
            ref={input}
            id="files"
            type="file"
            multiple
            disabled={busy}
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="block w-full text-sm file:mr-4 file:border file:border-washed-black/40 file:bg-transparent file:px-4 file:py-2 file:text-[10px] file:uppercase file:tracking-[0.2em]"
          />
          <p className="field-hint">JPG, PNG, WebP o AVIF · hasta 12 a la vez · se reducen en tu navegador antes de subirlas</p>
        </div>
        <div className="w-48">
          <label htmlFor="upload-color" className="field-label">
            Color
          </label>
          <select id="upload-color" value={colorId} onChange={(e) => setColorId(e.target.value)} disabled={busy} className="input py-1.5 text-xs">
            <option value="">Todos los colores</option>
            {colors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <button type="button" onClick={start} disabled={busy} className="btn-primary py-2.5">
          {busy ? `Subiendo ${done + failed + 1} de ${items.length}…` : 'Subir'}
        </button>
      </div>

      {notice && (
        <p className="alert-error" role="alert">
          {notice}
        </p>
      )}

      {items.length > 0 && (
        <div className="space-y-3" aria-live="polite">
          <div>
            <div className="flex justify-between text-[11px] uppercase tracking-[0.18em] text-washed-black/70">
              <span>{busy ? 'Subiendo fotos' : failed ? `${done} subidas · ${failed} con error` : `${done} fotos subidas`}</span>
              <span className="tabular-nums">{overall} %</span>
            </div>
            <div className="mt-2 h-1.5 w-full bg-washed-black/10" role="progressbar" aria-valuenow={overall} aria-valuemin={0} aria-valuemax={100} aria-label="Progreso total">
              <div className={`h-full transition-all duration-300 ${failed && !busy ? 'bg-terracotta' : 'bg-washed-black'}`} style={{ width: `${overall}%` }} />
            </div>
          </div>
          <ul className="divide-y divide-washed-black/10 border border-washed-black/10 bg-white/50">
            {items.map((it) => (
              <li key={it.id} className="px-3 py-2.5 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate" title={it.name}>
                    {it.name}
                    <span className="ml-2 text-washed-black/50">
                      {fmtBytes(it.originalBytes)}
                      {it.sentBytes && it.sentBytes < it.originalBytes ? ` → ${fmtBytes(it.sentBytes)}` : ''}
                    </span>
                  </span>
                  <span className={`shrink-0 tabular-nums ${it.status === 'error' ? 'text-terracotta' : it.status === 'done' ? 'text-washed-black' : 'text-washed-black/60'}`}>
                    {it.status === 'uploading' ? `${STATUS_TEXT.uploading} ${it.progress} %` : it.status === 'done' ? '✓ Lista' : STATUS_TEXT[it.status]}
                  </span>
                </div>
                {(it.status === 'uploading' || it.status === 'processing') && (
                  <div className="mt-2 h-1 w-full bg-washed-black/10">
                    <div className={`h-full bg-sage transition-all duration-200 ${it.status === 'processing' ? 'animate-pulse' : ''}`} style={{ width: `${it.progress}%` }} />
                  </div>
                )}
                {it.error && <p className="mt-1 text-terracotta">{it.error}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

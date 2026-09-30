'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { refreshCart } from '@/app/(tienda)/actions'
import type { CartLine } from '@/lib/types'

// Carrito por variante (SKU = talla + color). Se guarda en el navegador para conservarlo entre
// visitas, pero el servidor es la fuente de verdad: al cargar la página y al abrir el carrito se
// revalida (precio, stock, si sigue a la venta) y en el checkout se vuelve a calcular todo.

const STORAGE_KEY = 'kaeo:cart:v1'

interface CartValue {
  lines: CartLine[]
  /** El carrito ya se ha leído del navegador (evita parpadeos de "carrito vacío") */
  ready: boolean
  open: boolean
  setOpen: (open: boolean) => void
  add: (line: Omit<CartLine, 'qty'>, qty?: number) => void
  setQty: (variantId: string, qty: number) => void
  remove: (variantId: string) => void
  clear: () => void
  refresh: () => Promise<void>
  /** Aviso tras revalidar (precio cambiado, sin stock…) */
  notice: string | null
  dismissNotice: () => void
  /** Unidades de líneas disponibles */
  count: number
  /** Subtotal en céntimos de las líneas disponibles */
  subtotal: number
}

const CartContext = createContext<CartValue | null>(null)

function readStored(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((l) => l && typeof l.variantId === 'string' && Number.isInteger(l.qty)) : []
  } catch {
    return []
  }
}

function describeChanges(before: CartLine[], after: CartLine[]) {
  const msgs = new Set<string>()
  const prev = new Map(before.map((l) => [l.variantId, l]))
  for (const l of after) {
    const old = prev.get(l.variantId)
    const item = `${l.name} (${l.color.name}, ${l.size})`
    if (l.unavailable) {
      if (!old?.unavailable) msgs.add(`${item} ya no está disponible.`)
      continue
    }
    if (old && old.priceCents !== l.priceCents) msgs.add(`Ha cambiado el precio de ${l.name}.`)
    if (old && l.qty < old.qty)
      msgs.add(`${l.maxQty === 1 ? 'Solo queda 1' : `Solo quedan ${l.maxQty}`} de ${item}: hemos ajustado la cantidad.`)
  }
  if (after.length < before.length) msgs.add('Hemos quitado del carrito artículos que ya no existen.')
  return msgs.size ? [...msgs].join(' ') : null
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([])
  const [ready, setReady] = useState(false)
  const [open, setOpen] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const linesRef = useRef(lines)
  linesRef.current = lines

  const refresh = useCallback(async () => {
    const current = linesRef.current
    if (current.length === 0) return
    try {
      const fresh = await refreshCart(current.map((l) => ({ variantId: l.variantId, qty: l.qty })))
      // Una revalidación sin cambios no borra un aviso que el usuario aún no ha cerrado.
      const changes = describeChanges(current, fresh)
      if (changes) setNotice(changes)
      setLines(fresh)
    } catch {
      // Sin conexión: se conserva la copia local; el checkout volverá a validar.
    }
  }, [])

  // Carga inicial desde el navegador + revalidación
  useEffect(() => {
    const stored = readStored()
    setLines(stored)
    linesRef.current = stored
    setReady(true)
    if (stored.length) void refresh()
  }, [refresh])

  // Guardado y sincronización entre pestañas
  useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
    } catch {
      /* almacenamiento lleno o bloqueado: el carrito sigue funcionando en memoria */
    }
  }, [lines, ready])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => e.key === STORAGE_KEY && setLines(readStored())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Al abrir el carrito, datos frescos
  useEffect(() => {
    if (open) void refresh()
  }, [open, refresh])

  const value = useMemo<CartValue>(() => {
    const clamp = (qty: number, max: number) => Math.max(1, Math.min(qty, max))
    const available = lines.filter((l) => !l.unavailable)
    return {
      lines,
      ready,
      open,
      setOpen,
      notice,
      dismissNotice: () => setNotice(null),
      refresh,
      add: (line, qty = 1) => {
        setLines((prev) => {
          const found = prev.find((l) => l.variantId === line.variantId)
          if (found) return prev.map((l) => (l.variantId === line.variantId ? { ...line, qty: clamp(l.qty + qty, line.maxQty) } : l))
          return [...prev, { ...line, qty: clamp(qty, line.maxQty) }]
        })
        setOpen(true)
      },
      setQty: (variantId, qty) =>
        setLines((prev) =>
          qty <= 0 ? prev.filter((l) => l.variantId !== variantId) : prev.map((l) => (l.variantId === variantId ? { ...l, qty: clamp(qty, l.maxQty) } : l)),
        ),
      remove: (variantId) => setLines((prev) => prev.filter((l) => l.variantId !== variantId)),
      clear: () => setLines([]),
      count: available.reduce((n, l) => n + l.qty, 0),
      subtotal: available.reduce((n, l) => n + l.qty * l.priceCents, 0),
    }
  }, [lines, ready, open, notice, refresh])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => {
  const cart = useContext(CartContext)
  if (!cart) throw new Error('useCart debe usarse dentro de <CartProvider>')
  return cart
}

'use client'

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Product } from '@/data/products'
import type { ColorKey } from '@/data/palette'

export interface CartItem {
  key: string
  product: Product
  color: ColorKey
  qty: number
}

interface CartValue {
  items: CartItem[]
  open: boolean
  setOpen: (open: boolean) => void
  add: (product: Product, color: ColorKey) => void
  setQty: (key: string, qty: number) => void
  count: number
  total: number
}

const CartContext = createContext<CartValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [open, setOpen] = useState(false)

  const value = useMemo<CartValue>(() => {
    const add = (product: Product, color: ColorKey) => {
      const key = `${product.id}:${color}`
      setItems((prev) => {
        const found = prev.find((i) => i.key === key)
        if (found) return prev.map((i) => (i.key === key ? { ...i, qty: i.qty + 1 } : i))
        return [...prev, { key, product, color, qty: 1 }]
      })
      setOpen(true)
    }
    const setQty = (key: string, qty: number) =>
      setItems((prev) => (qty <= 0 ? prev.filter((i) => i.key !== key) : prev.map((i) => (i.key === key ? { ...i, qty } : i))))
    const count = items.reduce((n, i) => n + i.qty, 0)
    const total = items.reduce((n, i) => n + i.qty * i.product.price, 0)
    return { items, open, setOpen, add, setQty, count, total }
  }, [items, open])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => {
  const cart = useContext(CartContext)
  if (!cart) throw new Error('useCart debe usarse dentro de <CartProvider>')
  return cart
}

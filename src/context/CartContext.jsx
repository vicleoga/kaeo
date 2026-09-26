import { createContext, useContext, useMemo, useState } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)

  const value = useMemo(() => {
    const add = (product, color) => {
      const key = `${product.id}:${color}`
      setItems((prev) => {
        const found = prev.find((i) => i.key === key)
        if (found) return prev.map((i) => (i.key === key ? { ...i, qty: i.qty + 1 } : i))
        return [...prev, { key, product, color, qty: 1 }]
      })
      setOpen(true)
    }
    const setQty = (key, qty) =>
      setItems((prev) => (qty <= 0 ? prev.filter((i) => i.key !== key) : prev.map((i) => (i.key === key ? { ...i, qty } : i))))
    const count = items.reduce((n, i) => n + i.qty, 0)
    const total = items.reduce((n, i) => n + i.qty * i.product.price, 0)
    return { items, open, setOpen, add, setQty, count, total }
  }, [items, open])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => useContext(CartContext)

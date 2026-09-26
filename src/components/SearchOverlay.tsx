'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import type { ProductSummary } from '@/lib/types'
import { formatCents } from '@/lib/catalog'
import { CloseIcon } from './Icons'

interface SearchOverlayProps {
  open: boolean
  onClose: () => void
  products: ProductSummary[]
}

export default function SearchOverlay({ open, onClose, products }: SearchOverlayProps) {
  const [q, setQ] = useState('')
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) setTimeout(() => input.current?.focus(), 50)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const term = q.trim().toLowerCase()
  const results = term ? products.filter((p) =>
        `${p.name} ${p.category} ${p.colors.map((c) => c.name).join(' ')}`.toLowerCase().includes(term),
      ) : []

  return (
    <div
      className={`fixed inset-0 z-50 bg-offwhite transition-opacity duration-500 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      role="dialog"
      aria-modal="true"
      aria-label="Buscar productos"
      aria-hidden={!open}
    >
      <div className="mx-auto max-w-3xl px-6 pt-8 md:pt-16">
        <div className="flex justify-end">
          <button onClick={onClose} aria-label="Cerrar búsqueda" className="p-1">
            <CloseIcon />
          </button>
        </div>
        <label htmlFor="search" className="label mt-8 block text-washed-black/60">
          ¿Qué estás buscando?
        </label>
        <input
          id="search"
          ref={input}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="LINEN, TEE, SAGE…"
          className="mt-4 w-full rounded-none border-0 border-b border-washed-black/60 bg-transparent px-0 py-4 text-lg uppercase tracking-[0.2em] placeholder:text-washed-black/30 focus:border-washed-black focus:outline-none md:text-2xl"
        />
        <ul className="mt-8 max-h-[60vh] divide-y divide-washed-black/10 overflow-y-auto">
          {results.map((p) => (
            <li key={p.id}>
              <Link
                href={`/producto/${p.slug}`}
                onClick={onClose}
                className="flex items-center gap-4 py-4 transition-opacity hover:opacity-70"
              >
                <img src={p.image} alt="" className="h-16 w-12 object-cover" />
                <span className="flex-1 text-[11px] font-medium uppercase tracking-[0.18em]">{p.name}</span>
                <span className="label text-washed-black/50">{p.category}</span>
                <span className="text-xs">{formatCents(p.minPriceCents)}</span>
              </Link>
            </li>
          ))}
          {term && results.length === 0 && <li className="label py-6 text-washed-black/60">Sin resultados — prueba con “linen”.</li>}
        </ul>
      </div>
    </div>
  )
}

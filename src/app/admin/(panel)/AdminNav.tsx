'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ITEMS: { href: string; label: string; soon?: string }[] = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/productos', label: 'Productos' },
  { href: '/admin/inventario', label: 'Inventario' },
  { href: '/admin/pedidos', label: 'Pedidos' },
  { href: '/admin/clientes', label: 'Clientes' },
  { href: '/admin/descuentos', label: 'Descuentos' },
  { href: '/admin/suscriptores', label: 'Newsletter', soon: 'Fase 5' },
  { href: '/admin/configuracion', label: 'Configuración' },
]

export default function AdminNav() {
  const path = usePathname()
  const isActive = (href: string) => (href === '/admin' ? path === href : path.startsWith(href))
  return (
    <nav aria-label="Administración" className="overflow-x-auto px-3 pb-3 md:px-3 md:pb-0">
      <ul className="flex gap-1 md:flex-col">
        {ITEMS.map((item) => (
          <li key={item.href}>
            {item.soon ? (
              <span
                className="flex items-center justify-between gap-3 whitespace-nowrap px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-washed-black/30"
                title={`Disponible en la ${item.soon.toLowerCase()}`}
              >
                {item.label}
                <span className="hidden text-[9px] md:inline">{item.soon}</span>
              </span>
            ) : (
              <Link
                href={item.href}
                aria-current={isActive(item.href) ? 'page' : undefined}
                className={`block whitespace-nowrap px-3 py-2 text-[11px] uppercase tracking-[0.18em] transition-colors ${
                  isActive(item.href) ? 'bg-washed-black text-offwhite' : 'text-washed-black/75 hover:bg-washed-black/5'
                }`}
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}

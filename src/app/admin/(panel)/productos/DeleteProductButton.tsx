'use client'

import { useTransition } from 'react'
import { deleteProduct } from './actions'

export default function DeleteProductButton({ productId, name, compact = false }: { productId: string; name: string; compact?: boolean }) {
  const [pending, start] = useTransition()
  return (
    <button
      type="button"
      disabled={pending}
      className={compact ? 'btn-danger px-3 py-1.5' : 'btn-danger'}
      aria-label={compact ? `Borrar ${name}` : undefined}
      onClick={() => {
        if (confirm(`¿Borrar "${name}" con todas sus variantes y fotos? No se puede deshacer.\n\nSi solo quieres ocultarlo, pásalo a Borrador.`)) {
          start(() => deleteProduct(productId))
        }
      }}
    >
      {pending ? 'Borrando…' : compact ? 'Borrar' : 'Borrar producto'}
    </button>
  )
}

'use client'

import { useTransition } from 'react'
import { deleteProduct } from './actions'

export default function DeleteProductButton({ productId, name }: { productId: string; name: string }) {
  const [pending, start] = useTransition()
  return (
    <button
      type="button"
      disabled={pending}
      className="btn-danger"
      onClick={() => {
        if (confirm(`¿Borrar "${name}" con todas sus variantes y fotos? No se puede deshacer.\n\nSi solo quieres ocultarlo, pásalo a Borrador.`)) {
          start(() => deleteProduct(productId))
        }
      }}
    >
      {pending ? 'Borrando…' : 'Borrar producto'}
    </button>
  )
}

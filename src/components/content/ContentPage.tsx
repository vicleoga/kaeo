import type { ReactNode } from 'react'

/** Marco de las páginas de texto: legales, envíos, preguntas frecuentes, nosotros, contacto. */
export default function ContentPage({ kicker, title, intro, updated, children, wide = false }: { kicker: string; title: string; intro?: ReactNode; updated?: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className="px-5 pb-28 pt-28 md:px-10 md:pt-40">
      <header className="mx-auto max-w-2xl text-center">
        <p className="label text-washed-black/60">{kicker}</p>
        <h1 className="heading mt-6 text-2xl md:text-3xl">{title}</h1>
        <span className="divider mx-auto mt-6" aria-hidden="true" />
        {intro && <p className="mx-auto mt-8 max-w-lg text-sm leading-7 text-washed-black/70">{intro}</p>}
      </header>
      <div className={`mx-auto mt-16 ${wide ? 'max-w-4xl' : 'max-w-2xl'}`}>{children}</div>
      {updated && <p className="mx-auto mt-16 max-w-2xl text-xs text-washed-black/50">Última actualización: {updated}</p>}
    </div>
  )
}

/**
 * Texto pendiente de validar por la gestoría o un abogado. Se ve resaltado a propósito:
 * antes de abrir la tienda al público no debe quedar ninguno (búscalos con "Revisar" en el código).
 */
export function Revisar({ children }: { children: ReactNode }) {
  return (
    <mark className="revisar" title="Pendiente de revisar por la gestoría">
      [REVISAR] {children}
    </mark>
  )
}

/** Dato de la empresa o, si aún no está en Configuración, aviso de que falta. */
export function Dato({ value, label }: { value: string; label: string }) {
  const missing = !value || value.startsWith('REVISAR')
  return missing ? <Revisar>{label}</Revisar> : <>{value}</>
}

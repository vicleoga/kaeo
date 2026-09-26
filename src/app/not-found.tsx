import Link from 'next/link'
import Logo from '@/components/Logo'

export const metadata = { title: 'Página no encontrada' }

// 404 global. Va fuera del layout de la tienda para que también cubra rutas que no existen en ningún grupo.
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-24 text-center">
      <Link href="/" aria-label="KAEO — inicio">
        <Logo size={22} />
      </Link>
      <p className="label mt-16 text-washed-black/60">Error 404</p>
      <h1 className="heading mt-6 text-xl leading-[2] md:text-2xl">
        Lost at sea
        <br />
        No hurry
      </h1>
      <span className="divider mx-auto mt-8" aria-hidden="true" />
      <p className="mt-8 max-w-sm text-sm leading-7 text-washed-black/70">
        La página que buscas no existe o se ha movido. Vuelve a la orilla y sigue mirando sin prisa.
      </p>
      <p className="mt-10 font-script text-4xl text-washed-black/80">Good vibes further</p>
      <div className="mt-12 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-dark">
          Inicio
        </Link>
        <Link href="/hombre" className="btn-dark">
          Hombre
        </Link>
        <Link href="/mujer" className="btn-dark">
          Mujer
        </Link>
      </div>
    </main>
  )
}

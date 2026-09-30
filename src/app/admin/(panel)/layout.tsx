import type { ReactNode } from 'react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { requireAdmin } from '@/server/auth'
import { logout } from '../actions'
import AdminNav from './AdminNav'

// Todo lo que cuelga de (panel) exige sesión. Las server actions lo vuelven a comprobar por su cuenta.
export const dynamic = 'force-dynamic'

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin()
  return (
    <div className="md:flex">
      <aside className="border-b border-washed-black/10 bg-white/40 md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-5 py-5 md:block md:px-6 md:py-8">
          <Link href="/admin" aria-label="Dashboard">
            <Logo size={16} />
          </Link>
          <p className="label hidden text-washed-black/50 md:mt-3 md:block">Admin</p>
        </div>
        <AdminNav />
        <div className="hidden px-6 pb-6 md:absolute md:bottom-0 md:block">
          <p className="truncate text-xs text-washed-black/60" title={admin.login}>
            {admin.name}
          </p>
          <div className="mt-3 flex gap-4 text-[10px] uppercase tracking-[0.2em]">
            <Link href="/" className="text-washed-black/60 hover:text-washed-black" target="_blank">
              Ver tienda ↗
            </Link>
            <form action={logout}>
              <button type="submit" className="text-washed-black/60 hover:text-washed-black">
                Salir
              </button>
            </form>
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-5 py-8 md:px-10 md:py-12">
        <div className="mx-auto max-w-6xl">{children}</div>
        <form action={logout} className="mt-16 md:hidden">
          <button type="submit" className="btn-secondary">
            Salir
          </button>
        </form>
      </main>
    </div>
  )
}

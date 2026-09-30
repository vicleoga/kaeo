import { redirect } from 'next/navigation'
import Logo from '@/components/Logo'
import { getCurrentAdmin } from '@/server/auth'
import LoginForm from './LoginForm'

export const metadata = { title: 'Entrar' }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getCurrentAdmin()) redirect('/admin')
  const { next } = await searchParams
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-12 flex flex-col items-center gap-5 text-center">
          <Logo size={26} />
          <p className="label text-washed-black/60">Panel de administración</p>
          <span className="divider" aria-hidden="true" />
        </div>
        <LoginForm next={next} />
      </div>
    </main>
  )
}

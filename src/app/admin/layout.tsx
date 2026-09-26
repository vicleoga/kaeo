import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: { default: 'Administración', template: '%s · Admin KAEO' },
  robots: { index: false, follow: false },
}

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-offwhite">{children}</div>
}

import type { Metadata } from 'next'
import CatalogPage, { parseFilters } from '@/components/catalog/CatalogPage'

export const metadata: Metadata = {
  title: 'Mujer',
  description: 'Camisetas de algodón orgánico lavado, vestidos y pantalones de lino y tops de punto para mujer. Estilo mediterráneo y slow living.',
  alternates: { canonical: '/mujer' },
}

export default async function WomenPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <CatalogPage category="mujer" filters={parseFilters(await searchParams)} />
}

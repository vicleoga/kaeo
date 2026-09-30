import type { Metadata } from 'next'
import CatalogPage, { parseFilters } from '@/components/catalog/CatalogPage'

export const metadata: Metadata = {
  title: 'Hombre',
  description: 'Camisetas de algodón orgánico lavado, camisas y pantalones de lino para hombre. Estilo mediterráneo y slow living.',
  alternates: { canonical: '/hombre' },
}

export default async function MenPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <CatalogPage category="hombre" filters={parseFilters(await searchParams)} />
}

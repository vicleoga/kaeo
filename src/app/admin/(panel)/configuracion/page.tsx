import { prisma } from '@/server/db'
import { getCompany, getVatRateBp } from '@/server/settings'
import { centsToInput } from '@/lib/catalog'
import { CompanyForm, ShippingZonesForm, VatForm } from './SettingsForms'

export const metadata = { title: 'Configuración' }

export default async function SettingsPage() {
  const [zones, vatBp, company] = await Promise.all([prisma.shippingZone.findMany({ orderBy: { sortOrder: 'asc' } }), getVatRateBp(), getCompany()])

  return (
    <div className="space-y-8">
      <header>
        <h1 className="admin-h1">Configuración</h1>
        <p className="mt-2 text-sm text-washed-black/60">Envíos, impuestos y datos de la empresa. Las plantillas de email llegarán en la fase 5.</p>
      </header>

      <ShippingZonesForm
        zones={zones.map((z) => ({
          id: z.id,
          code: z.code,
          name: z.name,
          active: z.active,
          price: centsToInput(z.priceCents),
          freeFrom: centsToInput(z.freeFromCents),
          days: z.estimatedDays,
          where:
            z.code === 'PENINSULA'
              ? 'España salvo Baleares, Canarias, Ceuta y Melilla'
              : z.postalPrefixes.length
                ? `CP que empiezan por ${z.postalPrefixes.join(', ')}`
                : `${z.countries.length} países`,
        }))}
      />

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <VatForm vat={String(vatBp / 100).replace('.', ',')} />
        <CompanyForm company={company} />
      </div>
    </div>
  )
}

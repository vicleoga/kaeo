import type { Metadata } from 'next'
import Link from 'next/link'
import { getCompany } from '@/server/settings'
import { siteUrl } from '@/server/notifications'
import { LEGAL_UPDATED } from '@/lib/policies'
import ContentPage, { Dato, Revisar } from '@/components/content/ContentPage'

export const metadata: Metadata = { title: 'Aviso legal', description: 'Datos del titular de la web de KAEO y condiciones de uso.' }

export default async function LegalNoticePage() {
  const c = await getCompany()
  const domain = siteUrl().replace(/^https?:\/\//, '')

  return (
    <ContentPage kicker="Legal" title="Aviso legal" updated={LEGAL_UPDATED}>
      <div className="prose-kaeo">
        <h2>Titular de la web</h2>
        <p>En cumplimiento del artículo 10 de la Ley 34/2002, de servicios de la sociedad de la información y de comercio electrónico (LSSI), te informamos de que esta web ({domain}) pertenece a:</p>
        <ul>
          <li>
            Titular: <Dato value={c.legalName} label="razón social" />
          </li>
          <li>
            NIF: <Dato value={c.taxId} label="NIF / CIF" />
          </li>
          <li>
            Domicilio: <Dato value={c.address} label="dirección fiscal" />
          </li>
          <li>
            Email: <Dato value={c.email.endsWith('.example') ? '' : c.email} label="email de contacto" />
          </li>
          {c.phone && <li>Teléfono: {c.phone}</li>}
          <li>
            <Revisar>Datos registrales (Registro Mercantil de …, tomo, folio, hoja) si es una sociedad; si es autónomo, quitar esta línea.</Revisar>
          </li>
        </ul>
        <p>La marca comercial de la tienda es KAEO.</p>

        <h2>Uso de la web</h2>
        <p>
          Al navegar por esta web aceptas usarla de buena fe y conforme a la ley. No está permitido usarla para fines ilícitos, dañar su funcionamiento ni intentar acceder a zonas o datos
          a los que no tienes permiso.
        </p>

        <h2>Propiedad intelectual</h2>
        <p>
          Los textos, fotografías, diseños, logotipos y el resto de contenidos de esta web son de KAEO o de sus autores, y están protegidos por la legislación de propiedad intelectual e
          industrial. No se pueden reproducir, distribuir ni transformar sin nuestro permiso por escrito, salvo para uso personal y privado.
        </p>

        <h2>Responsabilidad</h2>
        <p>
          Cuidamos que la información de la web sea correcta y esté actualizada, pero puede contener errores puntuales. No respondemos de los daños derivados de interrupciones del servicio
          ajenas a nuestra voluntad ni del contenido de webs de terceros enlazadas desde aquí.
        </p>

        <h2>Compras, datos personales y cookies</h2>
        <p>
          Las compras se rigen por las <Link href="/legal/condiciones">condiciones de venta</Link>. Cómo tratamos tus datos está en la <Link href="/legal/privacidad">política de privacidad</Link>, y
          qué cookies usamos, en la <Link href="/legal/cookies">política de cookies</Link>.
        </p>

        <h2>Ley aplicable</h2>
        <p>
          Estas condiciones se rigen por la ley española. Si eres consumidor, para cualquier conflicto serán competentes los juzgados de tu domicilio.
        </p>
      </div>
    </ContentPage>
  )
}

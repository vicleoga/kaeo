import type { Metadata } from 'next'
import { LEGAL_UPDATED } from '@/lib/policies'
import ContentPage from '@/components/content/ContentPage'

export const metadata: Metadata = { title: 'Política de cookies', description: 'Qué cookies y almacenamiento local usa la web de KAEO.' }

// Hoy la web SOLO usa almacenamiento técnico (exento de consentimiento, art. 22.2 LSSI), por eso no
// hay banner de cookies. Si algún día se añade analítica, píxeles de publicidad o vídeos/mapas de
// terceros, habrá que añadir aquí esas cookies Y un banner que pida permiso ANTES de cargarlas.

export default function CookiesPage() {
  return (
    <ContentPage kicker="Legal" title="Política de cookies" updated={LEGAL_UPDATED} wide>
      <div className="prose-kaeo">
        <p>
          <strong>Resumen: no usamos cookies de publicidad ni de analítica, ni te seguimos por internet.</strong> Solo usamos lo imprescindible para que la tienda funcione, y por eso no te
          mostramos ningún aviso para aceptar cookies.
        </p>

        <h2>Qué son</h2>
        <p>
          Las cookies y el almacenamiento local son pequeños datos que una web guarda en tu navegador. Algunos son necesarios para que funcione (recordar tu carrito, por ejemplo); otros
          sirven para medir visitas o mostrar publicidad. Los primeros no necesitan tu permiso; los segundos, sí.
        </p>

        <h2>Qué usamos</h2>
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>De quién</th>
              <th>Para qué</th>
              <th>Duración</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>kaeo:cart:v1 (almacenamiento local)</td>
              <td>KAEO</td>
              <td>Recordar los productos de tu carrito</td>
              <td>Hasta que compras o lo vacías</td>
            </tr>
            <tr>
              <td>kaeo:checkoutKey (almacenamiento de sesión)</td>
              <td>KAEO</td>
              <td>Evitar que un pedido se duplique si recargas la página al pagar</td>
              <td>Hasta cerrar la pestaña</td>
            </tr>
            <tr>
              <td>kaeo_admin (cookie)</td>
              <td>KAEO</td>
              <td>Mantener la sesión del equipo de KAEO en el panel de gestión. No se usa con los clientes.</td>
              <td>Sesión de trabajo</td>
            </tr>
            <tr>
              <td>__cf_bm, cf_clearance (cookies)</td>
              <td>Cloudflare</td>
              <td>Proteger la web de bots y ataques. Solo aparecen en algunos casos.</td>
              <td>Hasta 30 minutos / 1 año</td>
            </tr>
          </tbody>
        </table>
        <p>Todas son técnicas o de seguridad y están exentas de consentimiento según el artículo 22.2 de la LSSI.</p>

        <h2>Cómo borrarlas</h2>
        <p>
          Puedes borrar las cookies y el almacenamiento local desde la configuración de tu navegador (normalmente en Privacidad o Datos de sitios). Si lo haces, se vaciará tu carrito.
        </p>
      </div>
    </ContentPage>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { getCompany } from '@/server/settings'
import { LEGAL_UPDATED } from '@/lib/policies'
import ContentPage, { Dato, Revisar } from '@/components/content/ContentPage'

export const metadata: Metadata = { title: 'Política de privacidad', description: 'Cómo trata KAEO tus datos personales.' }

export default async function PrivacyPage() {
  const c = await getCompany()
  const email = c.email.endsWith('.example') ? '' : c.email

  return (
    <ContentPage kicker="Legal" title="Política de privacidad" updated={LEGAL_UPDATED} wide>
      <div className="prose-kaeo">
        <p>
          <Revisar>Texto de partida. Debe revisarlo la gestoría o un abogado antes de abrir la tienda al público.</Revisar>
        </p>
        <p>Pedimos solo los datos que necesitamos y los usamos solo para lo que te contamos aquí.</p>

        <h2>Responsable</h2>
        <p>
          <Dato value={c.legalName} label="razón social" /> (NIF <Dato value={c.taxId} label="NIF" />), <Dato value={c.address} label="dirección fiscal" />. Email:{' '}
          <Dato value={email} label="email" />.
        </p>

        <h2>Qué datos tratamos, para qué y por qué</h2>
        <table>
          <thead>
            <tr>
              <th>Para qué</th>
              <th>Datos</th>
              <th>Base legal</th>
              <th>Cuánto tiempo</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Gestionar tu pedido: cobro, preparación, envío, devoluciones y los emails del pedido</td>
              <td>Nombre, email, teléfono (opcional), dirección de envío, productos comprados</td>
              <td>Ejecución del contrato de compra</td>
              <td>Mientras dure la relación y, después, el tiempo que exige la ley fiscal y mercantil (hasta 6 años)</td>
            </tr>
            <tr>
              <td>Contabilidad y facturación</td>
              <td>Datos del pedido y del pago (no los de la tarjeta)</td>
              <td>Obligación legal</td>
              <td>Los plazos legales (hasta 6 años)</td>
            </tr>
            <tr>
              <td>Responder a tus mensajes</td>
              <td>Nombre, email, número de pedido y lo que nos escribas</td>
              <td>Tu consentimiento al enviar el formulario, y nuestro interés legítimo en atenderte</td>
              <td>Hasta resolver tu consulta y, como máximo, 1 año después</td>
            </tr>
            <tr>
              <td>Seguridad de la web (evitar abusos y fraude)</td>
              <td>Dirección IP y datos técnicos de la conexión</td>
              <td>Interés legítimo</td>
              <td>Unos días, salvo que haga falta para investigar un incidente</td>
            </tr>
          </tbody>
        </table>
        <p>No tomamos decisiones automatizadas sobre ti ni hacemos perfiles. No te enviaremos publicidad.</p>

        <h2>Quién más ve tus datos</h2>
        <p>Solo los proveedores que necesitamos para darte el servicio, con contrato de encargado del tratamiento, y nunca para sus propios fines:</p>
        <ul>
          <li>
            Pasarela de pago (cobro con tarjeta): <Revisar>nombre del proveedor, p. ej. Stripe Payments Europe Ltd. (Irlanda)</Revisar>.
          </li>
          <li>
            Taller o proveedor de producción bajo pedido (nombre y dirección de envío): <Revisar>nombre del proveedor y país</Revisar>.
          </li>
          <li>Empresa de transporte que entrega el pedido (nombre, dirección y teléfono).</li>
          <li>IONOS (correo electrónico).</li>
          <li>Cloudflare (red de entrega y protección de la web; puede tratar tu IP).</li>
          <li>Gestoría, para la contabilidad; y las administraciones públicas cuando lo exija la ley.</li>
        </ul>
        <p>
          <Revisar>
            Transferencias internacionales: si algún proveedor trata datos fuera del Espacio Económico Europeo (p. ej. Cloudflare o Stripe en EE. UU.), indicar la garantía aplicable (Marco de
            Privacidad de Datos UE-EE. UU. o cláusulas contractuales tipo).
          </Revisar>
        </p>

        <h2>Tus derechos</h2>
        <p>
          Puedes pedirnos acceder a tus datos, rectificarlos, suprimirlos, limitar su uso, oponerte a su tratamiento o recibirlos en un formato portable, y retirar tu consentimiento
          cuando quieras. Escríbenos a <Dato value={email} label="email" /> indicando qué necesitas; si no podemos comprobar que eres tú, puede que te pidamos algún dato más.
        </p>
        <p>
          Si crees que no hemos tratado bien tus datos, puedes reclamar ante la Agencia Española de Protección de Datos (<a href="https://www.aepd.es" target="_blank" rel="noreferrer">aepd.es</a>).
        </p>

        <h2>Seguridad</h2>
        <p>
          La web funciona siempre con conexión cifrada (HTTPS), no guardamos datos de tarjetas y el acceso a la gestión de la tienda está protegido y limitado a nuestro equipo.
        </p>

        <h2>Cookies</h2>
        <p>
          Consulta la <Link href="/legal/cookies">política de cookies</Link>.
        </p>
      </div>
    </ContentPage>
  )
}

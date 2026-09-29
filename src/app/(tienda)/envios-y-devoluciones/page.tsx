import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/server/db'
import { formatCents } from '@/lib/catalog'
import { REFUND_DAYS, RETURN_DAYS } from '@/lib/policies'
import ContentPage, { Revisar } from '@/components/content/ContentPage'

export const metadata: Metadata = {
  title: 'Envíos y devoluciones',
  description: `Zonas, precios y plazos de envío de KAEO, y cómo devolver un pedido en ${RETURN_DAYS} días.`,
}

export default async function ShippingReturnsPage() {
  const zones = await prisma.shippingZone.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } })

  return (
    <ContentPage kicker="Sin prisa, pero llega" title="Envíos y devoluciones" intro="Preparamos cada pedido con calma y lo enviamos lo antes posible. Si algo no te convence, tienes tiempo de sobra para devolverlo.">
      <div className="prose-kaeo">
        <h2>Envíos</h2>
        <p>Por ahora enviamos a estas zonas:</p>
        <table>
          <thead>
            <tr>
              <th>Zona</th>
              <th>Precio</th>
              <th>Gratis desde</th>
              <th>Plazo</th>
            </tr>
          </thead>
          <tbody>
            {zones.map((z) => (
              <tr key={z.id}>
                <td>{z.name}</td>
                <td>{formatCents(z.priceCents)}</td>
                <td>{z.freeFromCents != null ? formatCents(z.freeFromCents) : '—'}</td>
                <td>{z.estimatedDays || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>
          Los precios incluyen IVA. El plazo cuenta desde que el pedido sale de nuestro taller; las prendas que hacemos bajo pedido pueden necesitar unos días más de preparación, y te
          avisaremos por email en cuanto salga. Con ese email recibirás el número de seguimiento, y siempre puedes consultar el estado en{' '}
          <Link href="/seguimiento">seguimiento de pedido</Link>.
        </p>
        <p>De momento no enviamos a Canarias, Ceuta, Melilla ni fuera de España. Esperamos hacerlo pronto.</p>

        <h2>Devoluciones</h2>
        <p>
          Tienes <strong>{RETURN_DAYS} días</strong> desde que recibes el pedido para devolverlo, sin tener que darnos explicaciones. Solo te pedimos que las prendas estén sin usar,
          sin lavar y con sus etiquetas.
        </p>
        <ol>
          <li>
            Escríbenos desde <Link href="/contacto">contacto</Link> (o responde al email de tu pedido) indicando el número de pedido y qué quieres devolver.
          </li>
          <li>Te contestaremos con la dirección y las instrucciones para el envío.</li>
          <li>
            Cuando recibamos y revisemos la devolución, te devolvemos el dinero por el mismo medio de pago en un máximo de {REFUND_DAYS} días. Si devuelves el pedido completo, también te
            devolvemos el envío original (el estándar).
          </li>
        </ol>
        <p>
          Gastos de la devolución: <Revisar>decidir si el envío de vuelta lo paga el cliente o KAEO y, si lo paga el cliente, indicar aquí el importe aproximado.</Revisar>
        </p>
        <p>
          <Revisar>
            Confirmar con la gestoría si las prendas estampadas bajo pedido se tratan igual que el resto (la ley excluye del desistimiento los productos personalizados para un cliente;
            un diseño de catálogo impreso bajo demanda normalmente no lo es).
          </Revisar>
        </p>

        <h2>Cambios de talla</h2>
        <p>
          La forma más rápida de cambiar de talla es devolver la prenda y hacer un pedido nuevo con la talla que necesitas: así no esperas a que nos llegue la devolución. Cada ficha de
          producto tiene su guía de tallas con las medidas de la prenda.
        </p>

        <h2>Si algo llega mal</h2>
        <p>
          Si una prenda llega con un defecto o no es lo que pediste, escríbenos con una foto y lo solucionamos sin coste para ti: te enviamos otra o te devolvemos el dinero. Además,
          todos nuestros productos tienen la garantía legal de conformidad (ver <Link href="/legal/condiciones">condiciones de venta</Link>).
        </p>
      </div>
    </ContentPage>
  )
}

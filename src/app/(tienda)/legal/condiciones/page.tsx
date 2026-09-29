import type { Metadata } from 'next'
import Link from 'next/link'
import { getCompany } from '@/server/settings'
import { REFUND_DAYS, RETURN_DAYS, WARRANTY_YEARS, LEGAL_UPDATED } from '@/lib/policies'
import ContentPage, { Dato, Revisar } from '@/components/content/ContentPage'

export const metadata: Metadata = { title: 'Condiciones de venta', description: 'Condiciones generales de compra en la tienda online de KAEO.' }

export default async function TermsPage() {
  const c = await getCompany()
  const email = c.email.endsWith('.example') ? '' : c.email

  return (
    <ContentPage kicker="Legal" title="Condiciones de venta" updated={LEGAL_UPDATED}>
      <div className="prose-kaeo">
        <p>
          <Revisar>Texto de partida. Debe revisarlo la gestoría o un abogado antes de abrir la tienda al público.</Revisar>
        </p>

        <h2>1. Quiénes somos</h2>
        <p>
          La tienda KAEO pertenece a <Dato value={c.legalName} label="razón social" />, con NIF <Dato value={c.taxId} label="NIF" /> y domicilio en{' '}
          <Dato value={c.address} label="dirección fiscal" />. Puedes escribirnos a <Dato value={email} label="email" /> o desde la página de <Link href="/contacto">contacto</Link>.
        </p>
        <p>Estas condiciones se aplican a las compras hechas en esta web por consumidores. Al hacer un pedido declaras haberlas leído y aceptado.</p>

        <h2>2. Productos y precios</h2>
        <p>
          Los precios están en euros e incluyen el IVA. Los gastos de envío se muestran aparte antes de pagar. Las fotos y colores son lo más fieles posible, pero pueden variar ligeramente
          según tu pantalla; las prendas teñidas en prenda tienen pequeñas diferencias de tono entre piezas, que forman parte de su carácter.
        </p>

        <h2>3. Cómo se hace un pedido</h2>
        <ol>
          <li>Añades los productos al carrito y pulsas finalizar compra.</li>
          <li>Escribes tus datos de contacto y la dirección de envío, y revisas el resumen: productos, envío y total.</li>
          <li>Aceptas estas condiciones y pagas con tarjeta en la pasarela segura.</li>
          <li>Cuando el pago se confirma, el contrato queda cerrado y te enviamos un email con el resumen del pedido.</li>
        </ol>
        <p>
          Puedes corregir cualquier dato antes de pagar. Guardamos el pedido y puedes consultarlo en todo momento desde el enlace del email o en <Link href="/seguimiento">seguimiento de pedido</Link>.
          El contrato se formaliza en español.
        </p>

        <h2>4. Pago</h2>
        <p>
          El pago se hace con tarjeta a través de un proveedor de pagos seguro. KAEO no ve ni guarda los datos de tu tarjeta. Podemos cancelar un pedido si el pago no se completa o si hay
          indicios de fraude; en ese caso te avisaremos y, si se hubiera cobrado algo, te lo devolveremos.
        </p>

        <h2>5. Envío</h2>
        <p>
          Enviamos a las zonas indicadas en <Link href="/envios-y-devoluciones">envíos y devoluciones</Link>, con los precios y plazos que allí aparecen. Algunas prendas se fabrican bajo pedido y
          necesitan unos días de preparación. En cualquier caso, entregaremos el pedido en un máximo de 30 días desde la compra; si no pudiéramos hacerlo, te avisaremos y podrás cancelarlo con
          reembolso completo.
        </p>

        <h2>6. Derecho de desistimiento y devoluciones</h2>
        <p>
          La ley te da 14 días naturales para desistir de la compra sin dar explicaciones. En KAEO lo ampliamos a <strong>{RETURN_DAYS} días naturales</strong> desde que recibes el pedido (o el
          último producto, si llega en varios envíos).
        </p>
        <p>
          Para ejercerlo, comunícanoslo de forma clara por email o desde <Link href="/contacto">contacto</Link>; puedes usar el modelo de formulario de más abajo, aunque no es obligatorio. Debes
          devolvernos los productos en un máximo de 14 días desde que nos lo comunicas.
        </p>
        <p>
          Te devolveremos todo lo que pagaste, incluido el envío original estándar, en un máximo de {REFUND_DAYS} días desde que nos comuniques el desistimiento, por el mismo medio de pago.
          Podemos esperar a recibir los productos (o a que nos envíes el justificante de envío) antes de hacer el reembolso.
        </p>
        <p>
          Los productos deben devolverse sin usar, sin lavar y con sus etiquetas. Si muestran un uso mayor del necesario para comprobarlos (como te los probarías en una tienda), podremos
          descontar la pérdida de valor.
        </p>
        <p>
          Coste de la devolución: <Revisar>indicar si lo paga el cliente (y su importe aproximado) o KAEO.</Revisar>
        </p>
        <p>
          <Revisar>
            Excepciones: confirmar si aplica alguna (p. ej. productos personalizados a petición del cliente, art. 103 de la Ley General para la Defensa de los Consumidores). Los diseños de
            catálogo fabricados bajo pedido normalmente NO son personalizados.
          </Revisar>
        </p>

        <h3>Modelo de formulario de desistimiento</h3>
        <p className="border border-washed-black/15 p-5">
          A la atención de <Dato value={c.legalName} label="razón social" />, <Dato value={c.address} label="dirección" />, <Dato value={email} label="email" />:
          <br />
          Por la presente le comunico que desisto de mi contrato de venta de los siguientes bienes: …
          <br />
          Pedido n.º … · Recibido el …
          <br />
          Nombre del consumidor: … · Dirección: …
          <br />
          Firma (solo si se envía en papel) · Fecha: …
        </p>

        <h2>7. Garantía</h2>
        <p>
          Todos los productos tienen la garantía legal de conformidad de {WARRANTY_YEARS} años desde la entrega. Si un producto tiene un defecto o no se corresponde con lo que compraste,
          escríbenos: lo repararemos, lo sustituiremos o, si no es posible, te devolveremos el dinero, sin coste para ti. El desgaste normal por el uso no está cubierto.
        </p>

        <h2>8. Datos personales</h2>
        <p>
          Usamos tus datos para gestionar tu pedido, como explicamos en la <Link href="/legal/privacidad">política de privacidad</Link>.
        </p>

        <h2>9. Reclamaciones y ley aplicable</h2>
        <p>
          Si tienes cualquier problema, escríbenos primero: queremos solucionarlo. También puedes pedir las hojas de reclamaciones oficiales o acudir a los servicios de consumo de tu comunidad
          autónoma. Estas condiciones se rigen por la ley española y, si eres consumidor, son competentes los juzgados de tu domicilio.
        </p>
        <p>
          <Revisar>Confirmar si KAEO se adhiere a algún sistema de resolución alternativa de conflictos (arbitraje de consumo) y, si es así, indicarlo aquí.</Revisar>
        </p>
      </div>
    </ContentPage>
  )
}

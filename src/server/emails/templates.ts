import 'server-only'
import { formatCents } from '@/lib/catalog'

// Plantillas de los emails. HTML con tablas y estilos en línea (lo único que respetan todos los
// clientes de correo) y siempre una versión en texto plano.

export interface RenderedEmail {
  subject: string
  html: string
  text: string
}

export interface EmailOrder {
  number: string
  email: string
  customerName: string
  url: string
  items: { productName: string; colorName: string; size: string; quantity: number; totalCents: number }[]
  subtotalCents: number
  discountCents: number
  discountCode: string | null
  shippingCents: number
  shippingName: string
  totalCents: number
  taxCents: number
  address: { name: string; line1: string; line2?: string | null; postalCode: string; city: string; province: string; country: string }
  tracking?: { carrier: string | null; trackingNumber: string | null; trackingUrl: string | null } | null
  reason?: string | null
}

const C = { bg: '#F7F5EF', ink: '#2E2E2E', muted: '#6F6B64', line: '#E4DED3', sand: '#D9C9B1' }

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

function layout(opts: { preheader: string; title: string; body: string; siteUrl: string; footer?: string }) {
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>${esc(opts.title)}</title></head>
<body style="margin:0;padding:0;background:${C.bg};color:${C.ink};font-family:Helvetica,Arial,sans-serif;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(opts.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
<tr><td align="center" style="padding:8px 0 28px;font-size:20px;letter-spacing:10px;font-weight:300;">K&Lambda;EO</td></tr>
<tr><td style="background:#ffffff;border:1px solid ${C.line};padding:36px 32px;">
<h1 style="margin:0 0 20px;font-size:15px;font-weight:400;letter-spacing:4px;text-transform:uppercase;">${esc(opts.title)}</h1>
${opts.body}
</td></tr>
<tr><td align="center" style="padding:24px 8px;font-size:11px;line-height:18px;color:${C.muted};">
${opts.footer ?? 'Mediterranean state of mind · T-shirts for a brighter tomorrow'}<br>
<a href="${opts.siteUrl}" style="color:${C.muted};">${esc(opts.siteUrl.replace(/^https?:\/\//, ''))}</a>
</td></tr>
</table></td></tr></table></body></html>`
}

const p = (html: string) => `<p style="margin:0 0 16px;font-size:14px;line-height:22px;">${html}</p>`
const button = (href: string, label: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td style="background:${C.ink};"><a href="${esc(href)}" style="display:inline-block;padding:14px 26px;color:#ffffff;text-decoration:none;font-size:11px;letter-spacing:3px;text-transform:uppercase;">${esc(label)}</a></td></tr></table>`

function itemsTable(o: EmailOrder) {
  const row = (label: string, value: string, strong = false) =>
    `<tr><td style="padding:4px 0;font-size:13px;${strong ? 'font-weight:bold;' : `color:${C.muted};`}">${label}</td><td align="right" style="padding:4px 0;font-size:13px;${strong ? 'font-weight:bold;' : ''}">${value}</td></tr>`
  const lines = o.items
    .map(
      (i) =>
        `<tr><td style="padding:10px 0;border-bottom:1px solid ${C.line};font-size:13px;line-height:19px;">${esc(i.productName)}<br><span style="color:${C.muted};">${esc(i.colorName)} · ${esc(i.size)} · ${i.quantity} ud.</span></td><td align="right" valign="top" style="padding:10px 0;border-bottom:1px solid ${C.line};font-size:13px;">${formatCents(i.totalCents)}</td></tr>`,
    )
    .join('')
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;">${lines}
<tr><td colspan="2" style="height:10px;"></td></tr>
${row('Subtotal', formatCents(o.subtotalCents))}
${o.discountCents ? row(`Descuento${o.discountCode ? ` (${esc(o.discountCode)})` : ''}`, `−${formatCents(o.discountCents)}`) : ''}
${row(`Envío · ${esc(o.shippingName)}`, o.shippingCents ? formatCents(o.shippingCents) : 'Gratis')}
${row('Total', formatCents(o.totalCents), true)}
${row('IVA incluido', formatCents(o.taxCents))}
</table>`
}

const addressHtml = (a: EmailOrder['address']) =>
  `<p style="margin:0 0 16px;font-size:13px;line-height:20px;color:${C.muted};">${[a.name, a.line1, a.line2, `${a.postalCode} ${a.city}`, a.province].filter(Boolean).map((l) => esc(l!)).join('<br>')}</p>`

const itemsText = (o: EmailOrder) =>
  [
    ...o.items.map((i) => `- ${i.productName} (${i.colorName} · ${i.size}) x${i.quantity}: ${formatCents(i.totalCents)}`),
    '',
    `Subtotal: ${formatCents(o.subtotalCents)}`,
    ...(o.discountCents ? [`Descuento${o.discountCode ? ` (${o.discountCode})` : ''}: -${formatCents(o.discountCents)}`] : []),
    `Envío (${o.shippingName}): ${o.shippingCents ? formatCents(o.shippingCents) : 'gratis'}`,
    `Total: ${formatCents(o.totalCents)} (IVA incluido: ${formatCents(o.taxCents)})`,
  ].join('\n')

const addressText = (a: EmailOrder['address']) => [a.name, a.line1, a.line2, `${a.postalCode} ${a.city}`, a.province].filter(Boolean).join('\n')
const firstName = (name: string) => name.trim().split(/\s+/)[0] || ''
const signature = '\n\nUn abrazo,\nEl equipo de KAEO'

// ───────────── Cliente ─────────────

export function orderConfirmed(o: EmailOrder, siteUrl: string): RenderedEmail {
  const subject = `Pedido ${o.number} confirmado`
  const html = layout({
    siteUrl,
    title: 'Gracias por tu pedido',
    preheader: `Hemos recibido tu pedido ${o.number}. Te avisamos cuando salga hacia ti.`,
    body:
      p(`Hola ${esc(firstName(o.customerName))},`) +
      p(`hemos recibido tu pedido <strong>${o.number}</strong> y el pago está confirmado. Lo preparamos sin prisa pero sin pausa, y te escribiremos en cuanto salga hacia ti.`) +
      itemsTable(o) +
      `<p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;">Dirección de envío</p>` +
      addressHtml(o.address) +
      button(o.url, 'Ver mi pedido') +
      p(`¿Alguna duda? Responde a este email y te contestamos.`),
  })
  const text = `Hola ${firstName(o.customerName)},\n\nhemos recibido tu pedido ${o.number} y el pago está confirmado. Te escribiremos en cuanto salga hacia ti.\n\n${itemsText(o)}\n\nDirección de envío:\n${addressText(o.address)}\n\nVer tu pedido: ${o.url}\n\n¿Alguna duda? Responde a este email.${signature}`
  return { subject, html, text }
}

export function orderShipped(o: EmailOrder, siteUrl: string): RenderedEmail {
  const t = o.tracking
  const trackLine = t?.trackingNumber ? `${t.carrier ? `${t.carrier} · ` : ''}${t.trackingNumber}` : null
  const subject = `Tu pedido ${o.number} va de camino`
  const html = layout({
    siteUrl,
    title: 'Tu pedido va de camino',
    preheader: `El pedido ${o.number} ya ha salido.`,
    body:
      p(`Hola ${esc(firstName(o.customerName))},`) +
      p(`tu pedido <strong>${o.number}</strong> ya ha salido hacia:`) +
      addressHtml(o.address) +
      (trackLine ? p(`Número de seguimiento: <strong>${esc(trackLine)}</strong>`) : '') +
      (t?.trackingUrl ? button(t.trackingUrl, 'Seguir el envío') : button(o.url, 'Ver mi pedido')) +
      p(`Esperamos que lo disfrutes despacio.`),
  })
  const text = `Hola ${firstName(o.customerName)},\n\ntu pedido ${o.number} ya ha salido hacia:\n${addressText(o.address)}\n${trackLine ? `\nNúmero de seguimiento: ${trackLine}` : ''}${t?.trackingUrl ? `\nSeguir el envío: ${t.trackingUrl}` : ''}\n\nVer tu pedido: ${o.url}${signature}`
  return { subject, html, text }
}

export function orderDelivered(o: EmailOrder, siteUrl: string): RenderedEmail {
  const subject = `Tu pedido ${o.number} ha llegado`
  const html = layout({
    siteUrl,
    title: 'Ya está en casa',
    preheader: `El pedido ${o.number} consta como entregado.`,
    body:
      p(`Hola ${esc(firstName(o.customerName))},`) +
      p(`el transportista marca tu pedido <strong>${o.number}</strong> como entregado. Ojalá te acompañe muchos veranos.`) +
      p(`Si algo no está bien o no te sienta como esperabas, responde a este email y lo solucionamos: tienes las condiciones en la página de envíos y devoluciones.`) +
      button(`${siteUrl}/envios-y-devoluciones`, 'Envíos y devoluciones'),
  })
  const text = `Hola ${firstName(o.customerName)},\n\nel transportista marca tu pedido ${o.number} como entregado.\n\nSi algo no está bien, responde a este email y lo solucionamos. Envíos y devoluciones: ${siteUrl}/envios-y-devoluciones${signature}`
  return { subject, html, text }
}

export function orderRefunded(o: EmailOrder, siteUrl: string, cancelled: boolean): RenderedEmail {
  const subject = cancelled ? `Pedido ${o.number} cancelado` : `Reembolso del pedido ${o.number}`
  const refundLine = `Te hemos devuelto ${formatCents(o.totalCents)} al mismo medio de pago. Según tu banco, puede tardar de 5 a 10 días en aparecer.`
  const lead = cancelled ? `hemos cancelado tu pedido <strong>${o.number}</strong>.` : `hemos tramitado el reembolso de tu pedido <strong>${o.number}</strong>.`
  const html = layout({
    siteUrl,
    title: cancelled ? 'Pedido cancelado' : 'Reembolso tramitado',
    preheader: cancelled ? `El pedido ${o.number} se ha cancelado.` : `Reembolso del pedido ${o.number}.`,
    body:
      p(`Hola ${esc(firstName(o.customerName))},`) +
      p(lead) +
      (o.reason ? p(`Motivo: ${esc(o.reason)}`) : '') +
      p(refundLine) +
      p(`Si tienes cualquier pregunta, responde a este email.`),
  })
  const text = `Hola ${firstName(o.customerName)},\n\n${lead.replace(/<\/?strong>/g, '')}\n${o.reason ? `Motivo: ${o.reason}\n` : ''}\n${refundLine}\n\nSi tienes cualquier pregunta, responde a este email.${signature}`
  return { subject, html, text }
}

/** Cancelación de un pedido que no se llegó a cobrar: no hay reembolso que mencionar */
export function orderCancelledUnpaid(o: EmailOrder, siteUrl: string): RenderedEmail {
  const subject = `Pedido ${o.number} cancelado`
  const html = layout({
    siteUrl,
    title: 'Pedido cancelado',
    preheader: `El pedido ${o.number} se ha cancelado.`,
    body: p(`Hola ${esc(firstName(o.customerName))},`) + p(`hemos cancelado tu pedido <strong>${o.number}</strong>. No se te ha cobrado nada.`) + (o.reason ? p(`Motivo: ${esc(o.reason)}`) : ''),
  })
  const text = `Hola ${firstName(o.customerName)},\n\nhemos cancelado tu pedido ${o.number}. No se te ha cobrado nada.${o.reason ? `\nMotivo: ${o.reason}` : ''}${signature}`
  return { subject, html, text }
}

// ───────────── Avisos internos ─────────────

export function adminOrder(o: EmailOrder, siteUrl: string, adminUrl: string, needsReview: boolean): RenderedEmail {
  const subject = needsReview ? `⚠ Pedido ${o.number} requiere revisión` : `Nuevo pedido ${o.number} · ${formatCents(o.totalCents)}`
  const lead = needsReview
    ? 'Este pedido necesita que lo mires: stock insuficiente, importe que no cuadra o fallo del proveedor de producción. El motivo está en su historial.'
    : `${esc(o.customerName)} (${esc(o.email)}) ha hecho un pedido.`
  const html = layout({
    siteUrl,
    title: needsReview ? 'Pedido a revisar' : 'Nuevo pedido',
    preheader: subject,
    footer: 'Aviso interno de la tienda KAEO',
    body: p(lead) + itemsTable(o) + addressHtml(o.address) + button(adminUrl, 'Abrir en el admin'),
  })
  const text = `${lead}\n\n${itemsText(o)}\n\n${addressText(o.address)}\n\nAbrir en el admin: ${adminUrl}`
  return { subject, html, text }
}

export function adminContact(m: { name: string; email: string; orderNumber: string | null; message: string }, siteUrl: string, adminUrl: string): RenderedEmail {
  const subject = `Mensaje de contacto de ${m.name}${m.orderNumber ? ` · ${m.orderNumber}` : ''}`
  const html = layout({
    siteUrl,
    title: 'Nuevo mensaje',
    preheader: m.message.slice(0, 90),
    footer: 'Aviso interno de la tienda KAEO · responde a este email para contestar al cliente',
    body:
      p(`<strong>${esc(m.name)}</strong> &lt;${esc(m.email)}&gt;${m.orderNumber ? `<br>Pedido: ${esc(m.orderNumber)}` : ''}`) +
      `<div style="margin:0 0 16px;padding:16px;background:${C.bg};font-size:14px;line-height:22px;white-space:pre-wrap;">${esc(m.message)}</div>` +
      button(adminUrl, 'Ver mensajes'),
  })
  const text = `${m.name} <${m.email}>${m.orderNumber ? `\nPedido: ${m.orderNumber}` : ''}\n\n${m.message}\n\nResponde a este email para contestar al cliente.\n${adminUrl}`
  return { subject, html, text }
}

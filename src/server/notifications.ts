import 'server-only'

// Punto único de avisos por eventos de pedido. En la fase 5 envía los emails
// (confirmación, enviado, cancelado/reembolsado y avisos internos).

export type OrderNotification =
  | 'order.confirmed'
  | 'order.shipped'
  | 'order.cancelled'
  | 'order.refunded'
  | 'admin.new_order'
  | 'admin.needs_review'

export async function notifyOrder(orderId: string, kind: OrderNotification) {
  console.info(`[aviso] ${kind} · pedido ${orderId}`)
}

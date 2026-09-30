export const EMAIL_KIND_LABEL: Record<string, string> = {
  'order.confirmed': 'Confirmación de pedido',
  'order.shipped': 'Pedido enviado',
  'order.delivered': 'Pedido entregado',
  'order.refunded': 'Reembolso',
  'order.cancelled': 'Cancelación',
  'admin.new_order': 'Aviso: nuevo pedido',
  'admin.needs_review': 'Aviso: pedido a revisar',
  'admin.contact': 'Aviso: mensaje de contacto',
  test: 'Prueba',
}

export const EMAIL_STATUS: Record<string, { label: string; className: string }> = {
  SENT: { label: 'Enviado', className: 'bg-sage/25 text-washed-black' },
  LOGGED: { label: 'No enviado (modo log)', className: 'bg-sand/40 text-washed-black' },
  FAILED: { label: 'Fallido', className: 'bg-terracotta/15 text-terracotta' },
}

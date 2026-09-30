// Estados de pedido: etiquetas y transiciones permitidas (módulo puro, servidor y cliente).

export const ORDER_STATUSES = [
  'PENDING_PAYMENT',
  'PAID',
  'SENT_TO_PRODUCTION',
  'IN_PRODUCTION',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'PAYMENT_FAILED',
  'REFUNDED',
  'NEEDS_REVIEW',
] as const

export type OrderStatusValue = (typeof ORDER_STATUSES)[number]

export const STATUS_LABEL: Record<OrderStatusValue, string> = {
  PENDING_PAYMENT: 'Pendiente de pago',
  PAID: 'Pagado',
  SENT_TO_PRODUCTION: 'Enviado a producción',
  IN_PRODUCTION: 'En producción',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
  PAYMENT_FAILED: 'Pago fallido',
  REFUNDED: 'Reembolsado',
  NEEDS_REVIEW: 'Requiere revisión',
}

/** Clases del distintivo de cada estado */
export const STATUS_BADGE: Record<OrderStatusValue, string> = {
  PENDING_PAYMENT: 'bg-washed-black/5 text-washed-black/60',
  PAID: 'bg-sage/25 text-washed-black',
  SENT_TO_PRODUCTION: 'bg-sand/60 text-washed-black',
  IN_PRODUCTION: 'bg-sand/60 text-washed-black',
  SHIPPED: 'bg-washed-blue/20 text-washed-black',
  DELIVERED: 'bg-sage/40 text-washed-black',
  CANCELLED: 'bg-washed-black/10 text-washed-black/60',
  PAYMENT_FAILED: 'bg-terracotta/15 text-terracotta',
  REFUNDED: 'bg-washed-black/10 text-washed-black/60',
  NEEDS_REVIEW: 'bg-terracotta text-offwhite',
}

/**
 * Transiciones permitidas. Cualquier cambio de estado (webhook, admin o sistema) pasa por aquí.
 * Cancelado y reembolsado son finales.
 */
export const TRANSITIONS: Record<OrderStatusValue, OrderStatusValue[]> = {
  PENDING_PAYMENT: ['PAID', 'PAYMENT_FAILED', 'CANCELLED'],
  PAYMENT_FAILED: ['PAID', 'CANCELLED'],
  PAID: ['SENT_TO_PRODUCTION', 'SHIPPED', 'NEEDS_REVIEW', 'CANCELLED', 'REFUNDED'],
  SENT_TO_PRODUCTION: ['IN_PRODUCTION', 'SHIPPED', 'NEEDS_REVIEW', 'CANCELLED', 'REFUNDED'],
  IN_PRODUCTION: ['SHIPPED', 'NEEDS_REVIEW', 'REFUNDED'],
  SHIPPED: ['DELIVERED', 'REFUNDED'],
  DELIVERED: ['REFUNDED'],
  NEEDS_REVIEW: ['PAID', 'SENT_TO_PRODUCTION', 'IN_PRODUCTION', 'SHIPPED', 'CANCELLED', 'REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
}

export const canTransition = (from: OrderStatusValue, to: OrderStatusValue) => TRANSITIONS[from].includes(to)

/** Estados en los que el dinero se ha cobrado y no se ha devuelto (cuentan como venta). */
export const SALE_STATUSES: OrderStatusValue[] = ['PAID', 'SENT_TO_PRODUCTION', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED', 'NEEDS_REVIEW']

/** Pasos que ve el cliente en su página de seguimiento */
export const CUSTOMER_STEPS: { status: OrderStatusValue[]; label: string }[] = [
  { status: ['PAID', 'NEEDS_REVIEW'], label: 'Pedido confirmado' },
  { status: ['SENT_TO_PRODUCTION', 'IN_PRODUCTION'], label: 'En preparación' },
  { status: ['SHIPPED'], label: 'Enviado' },
  { status: ['DELIVERED'], label: 'Entregado' },
]

/** Número público del pedido: KAEO-26-000123 */
export const orderNumber = (seq: number, date = new Date()) => `KAEO-${String(date.getFullYear()).slice(-2)}-${String(seq).padStart(6, '0')}`

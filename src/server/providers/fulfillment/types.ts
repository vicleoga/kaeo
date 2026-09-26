/**
 * Proveedor de producción bajo demanda (hoy: mock; previsiblemente Gelato, Printful o similar).
 * Para añadir uno real: implementar esta interfaz y registrarlo en ./index.ts.
 */
export interface FulfillmentProvider {
  readonly name: string
  /** Envía el pedido a producción. Lanza si el proveedor lo rechaza o no responde. */
  submitOrder(order: FulfillmentOrder): Promise<{ providerRef: string }>
  /** Consulta el estado actual (para sincronizar a mano si se pierde un webhook) */
  getStatus(providerRef: string): Promise<FulfillmentUpdate>
  /** Verifica la firma del webhook y lo traduce a un evento normalizado. Lanza si no es válida. */
  parseWebhook(rawBody: string, headers: Headers): Promise<FulfillmentWebhookEvent>
}

export interface FulfillmentOrder {
  orderNumber: string
  email: string
  address: ShippingAddress
  items: { sku: string; providerRef: string | null; productName: string; size: string; colorName: string; quantity: number }[]
}

export interface ShippingAddress {
  name: string
  phone?: string | null
  line1: string
  line2?: string | null
  postalCode: string
  city: string
  province: string
  country: string
}

export interface FulfillmentUpdate {
  status: 'SUBMITTED' | 'IN_PRODUCTION' | 'SHIPPED' | 'DELIVERED' | 'FAILED' | 'CANCELLED'
  carrier?: string
  trackingNumber?: string
  trackingUrl?: string
  message?: string
}

export interface FulfillmentWebhookEvent extends FulfillmentUpdate {
  eventId: string
  providerRef: string
}

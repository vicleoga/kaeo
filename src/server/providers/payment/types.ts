/**
 * Proveedor de pago (hoy: mock; previsiblemente Stripe).
 * Para añadir uno real: implementar esta interfaz en un fichero nuevo y registrarlo en ./index.ts.
 */
export interface PaymentProvider {
  readonly name: string
  /** Crea la sesión de pago y devuelve adónde redirigir al cliente */
  createSession(input: CreateSessionInput): Promise<{ providerRef: string; redirectUrl: string }>
  /** Devuelve dinero de un pago ya cobrado */
  refund(input: { providerRef: string; amountCents: number; reason?: string }): Promise<{ refundRef: string }>
  /** Verifica la firma del webhook y lo traduce a un evento normalizado. Lanza si la firma no es válida. */
  parseWebhook(rawBody: string, headers: Headers): Promise<PaymentWebhookEvent>
}

export interface CreateSessionInput {
  orderId: string
  orderNumber: string
  amountCents: number
  currency: string
  email: string
  /** URL absoluta de vuelta tras pagar (o fallar) */
  returnUrl: string
}

export interface PaymentWebhookEvent {
  /** Id único del evento en el proveedor (para idempotencia) */
  eventId: string
  type: 'payment.succeeded' | 'payment.failed' | 'ignored'
  /** Referencia de la sesión/pago (Payment.providerRef) */
  providerRef: string
  amountCents?: number
  failureReason?: string
}

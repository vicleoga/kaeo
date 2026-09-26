import 'server-only'
import { mockPayment } from './mock'
import type { PaymentProvider } from './types'

// Proveedor elegido con PAYMENT_PROVIDER. Para Stripe: crear ./stripe.ts con la interfaz
// PaymentProvider (Checkout Sessions + stripe.webhooks.constructEvent) y añadirlo aquí.
export function getPaymentProvider(): PaymentProvider {
  const name = process.env.PAYMENT_PROVIDER || 'mock'
  switch (name) {
    case 'mock':
      return mockPayment
    default:
      throw new Error(`PAYMENT_PROVIDER desconocido: ${name}`)
  }
}

export const isMockPayment = () => (process.env.PAYMENT_PROVIDER || 'mock') === 'mock'

export type { PaymentProvider, PaymentWebhookEvent } from './types'

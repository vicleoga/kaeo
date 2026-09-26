import 'server-only'
import { mockFulfillment } from './mock'
import type { FulfillmentProvider } from './types'

// Proveedor elegido con FULFILLMENT_PROVIDER. Para Gelato/Printful: crear ./gelato.ts (o similar)
// con la interfaz FulfillmentProvider y añadirlo aquí.
export function getFulfillmentProvider(): FulfillmentProvider {
  const name = process.env.FULFILLMENT_PROVIDER || 'mock'
  switch (name) {
    case 'mock':
      return mockFulfillment
    default:
      throw new Error(`FULFILLMENT_PROVIDER desconocido: ${name}`)
  }
}

export const isMockFulfillment = () => (process.env.FULFILLMENT_PROVIDER || 'mock') === 'mock'

export type { FulfillmentProvider, FulfillmentWebhookEvent, ShippingAddress } from './types'

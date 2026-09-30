// Envía un webhook firmado a la tienda, como lo haría un proveedor. Útil para probar a mano.
//
//   node scripts/send-test-webhook.mjs pago '{"eventId":"evt_1","type":"payment.succeeded","providerRef":"mock_pay_…"}'
//   node scripts/send-test-webhook.mjs produccion '{"eventId":"evt_2","providerRef":"mock_ful_…","status":"SHIPPED","carrier":"SEUR","trackingNumber":"123"}'
//
// Opciones por entorno: URL (por defecto http://localhost:3000), PAYMENT_WEBHOOK_SECRET / FULFILLMENT_WEBHOOK_SECRET
// (por defecto, los secretos de desarrollo), BAD_SIGNATURE=1 o OLD_TIMESTAMP=1 para probar rechazos.

import { createHmac } from 'node:crypto'

const [kind, body] = process.argv.slice(2)
if (!['pago', 'produccion'].includes(kind) || !body) {
  console.error('Uso: node scripts/send-test-webhook.mjs <pago|produccion> \'<json>\'')
  process.exit(1)
}
const envName = kind === 'pago' ? 'PAYMENT_WEBHOOK_SECRET' : 'FULFILLMENT_WEBHOOK_SECRET'
const secret = process.env[envName] || `dev-secret-${envName.toLowerCase()}`
const t = Math.floor(Date.now() / 1000) - (process.env.OLD_TIMESTAMP ? 3600 : 0)
let v1 = createHmac('sha256', secret).update(`${t}.${body}`).digest('hex')
if (process.env.BAD_SIGNATURE) v1 = v1.replace(/^./, (c) => (c === 'a' ? 'b' : 'a'))

const url = `${process.env.URL || 'http://localhost:3000'}/api/webhooks/${kind}`
const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'x-kaeo-signature': `t=${t},v1=${v1}` }, body })
console.log(res.status, await res.text())

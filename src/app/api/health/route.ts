// Comprobación de estado para Docker / el proxy. En la fase 2 comprobará también la base de datos.
export const dynamic = 'force-dynamic'

export function GET() {
  return Response.json({ status: 'ok' })
}

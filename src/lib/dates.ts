// Fechas de formularios (<input type="datetime-local">) en hora peninsular española,
// independientemente de la zona horaria del servidor (en Docker, UTC).

const TZ = 'Europe/Madrid'

/** "2026-09-27T10:00" (hora de Madrid) → Date */
export function fromMadridLocal(value: string): Date {
  const asUtc = new Date(`${value}:00Z`)
  const madrid = new Date(asUtc.toLocaleString('en-US', { timeZone: TZ }))
  const utc = new Date(asUtc.toLocaleString('en-US', { timeZone: 'UTC' }))
  return new Date(asUtc.getTime() - (madrid.getTime() - utc.getTime()))
}

/** Date → "2026-09-27T10:00" en hora de Madrid (para rellenar el input) */
export const toMadridLocal = (d: Date | null) => (d ? d.toLocaleString('sv-SE', { timeZone: TZ }).replace(' ', 'T').slice(0, 16) : '')

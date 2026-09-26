'use client'

import { useActionState, useState, useTransition } from 'react'
import { STATUS_LABEL, type OrderStatusValue } from '@/lib/orderStatus'
import { addNote, cancel, changeStatus, refund, resendToProduction, shipManually, simulateFulfillment, type OrderActionState } from '../actions'

interface Props {
  orderId: string
  status: OrderStatusValue
  allowed: OrderStatusValue[]
  canCancel: boolean
  canRefund: boolean
  canResend: boolean
  canShip: boolean
  mock: { providerRef: string } | null
  internalNotes: string
}

function Feedback({ state }: { state: OrderActionState }) {
  if (state.error)
    return (
      <p className="alert-error mt-3 text-xs" role="alert">
        {state.error}
      </p>
    )
  if (state.ok)
    return (
      <p className="alert-ok mt-3 text-xs" role="status">
        {state.ok}
      </p>
    )
  return null
}

export default function OrderActions(p: Props) {
  const [statusState, statusAction, statusPending] = useActionState(changeStatus.bind(null, p.orderId), {})
  const [refundState, refundAction, refundPending] = useActionState(refund.bind(null, p.orderId), {})
  const [cancelState, cancelAction, cancelPending] = useActionState(cancel.bind(null, p.orderId), {})
  const [shipState, shipAction, shipPending] = useActionState(shipManually.bind(null, p.orderId), {})
  const [noteState, noteAction, notePending] = useActionState(addNote.bind(null, p.orderId), {})
  const [quick, setQuick] = useState<OrderActionState>({})
  const [busy, start] = useTransition()
  const runQuick = (fn: () => Promise<OrderActionState>) => start(async () => setQuick(await fn()))

  return (
    <div className="space-y-6">
      {p.allowed.length > 0 && (
        <form action={statusAction} className="admin-card space-y-3">
          <h2 className="admin-h2">Cambiar estado</h2>
          <select name="status" className="input" aria-label="Nuevo estado">
            {p.allowed.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
          <input name="note" placeholder="Nota (opcional, queda en el historial)" className="input" maxLength={500} />
          <button className="btn-primary w-full" disabled={statusPending}>
            {statusPending ? 'Guardando…' : 'Cambiar estado'}
          </button>
          <Feedback state={statusState} />
        </form>
      )}

      {(p.canResend || p.mock) && (
        <section className="admin-card space-y-3">
          <h2 className="admin-h2">Producción</h2>
          {p.canResend && (
            <button className="btn-secondary w-full" disabled={busy} onClick={() => runQuick(() => resendToProduction(p.orderId))}>
              Reenviar a producción
            </button>
          )}
          {p.mock && (
            <div className="border border-dashed border-washed-black/25 p-3">
              <p className="text-[11px] text-washed-black/60">Proveedor simulado: envía el webhook que mandaría el proveedor real.</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {(
                  [
                    ['IN_PRODUCTION', 'En producción'],
                    ['SHIPPED', 'Enviado'],
                    ['DELIVERED', 'Entregado'],
                    ['FAILED', 'Fallo'],
                  ] as const
                ).map(([s, label]) => (
                  <button key={s} className={s === 'FAILED' ? 'btn-danger px-2' : 'btn-secondary px-2'} disabled={busy} onClick={() => runQuick(() => simulateFulfillment(p.orderId, s))}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <Feedback state={quick} />
        </section>
      )}

      {p.canShip && (
        <form action={shipAction} className="admin-card space-y-3">
          <h2 className="admin-h2">Marcar como enviado</h2>
          <p className="text-[11px] text-washed-black/60">Para pedidos de stock propio o si el proveedor no informa.</p>
          <input name="carrier" placeholder="Transportista (p. ej. Correos)" className="input" required />
          <input name="trackingNumber" placeholder="Nº de seguimiento" className="input" required />
          <input name="trackingUrl" placeholder="URL de seguimiento (opcional)" className="input" type="url" />
          <button className="btn-secondary w-full" disabled={shipPending}>
            {shipPending ? 'Guardando…' : 'Marcar como enviado'}
          </button>
          <Feedback state={shipState} />
        </form>
      )}

      {(p.canRefund || p.canCancel) && (
        <section className="admin-card space-y-4">
          <h2 className="admin-h2">Cancelar o reembolsar</h2>
          <p className="text-[11px] leading-5 text-washed-black/60">
            Devuelve el importe cobrado por la pasarela y, si no se había enviado, repone el stock propio.
          </p>
          {p.canRefund && (
            <form action={refundAction} onSubmit={(e) => !confirm('¿Reembolsar el importe completo de este pedido?') && e.preventDefault()} className="space-y-2">
              <input name="reason" placeholder="Motivo del reembolso" className="input" maxLength={500} />
              <button className="btn-danger w-full" disabled={refundPending}>
                {refundPending ? 'Reembolsando…' : 'Reembolsar'}
              </button>
              <Feedback state={refundState} />
            </form>
          )}
          {p.canCancel && (
            <form action={cancelAction} onSubmit={(e) => !confirm('¿Cancelar este pedido? Si estaba cobrado se reembolsará.') && e.preventDefault()} className="space-y-2">
              <input name="reason" placeholder="Motivo de la cancelación" className="input" maxLength={500} />
              <button className="btn-danger w-full" disabled={cancelPending}>
                {cancelPending ? 'Cancelando…' : 'Cancelar pedido'}
              </button>
              <Feedback state={cancelState} />
            </form>
          )}
        </section>
      )}

      <form action={noteAction} className="admin-card space-y-3">
        <h2 className="admin-h2">Notas internas</h2>
        {p.internalNotes ? (
          <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap font-sans text-xs leading-5 text-washed-black/75">{p.internalNotes}</pre>
        ) : (
          <p className="text-xs text-washed-black/50">Sin notas. El cliente no las ve.</p>
        )}
        <textarea name="note" rows={2} placeholder="Añadir nota…" className="input text-sm" maxLength={1000} />
        <button className="btn-secondary w-full" disabled={notePending}>
          Añadir nota
        </button>
        <Feedback state={noteState} />
      </form>
    </div>
  )
}

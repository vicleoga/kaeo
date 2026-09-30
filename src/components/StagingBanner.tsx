import { isStaging } from '@/lib/env'

/** Aviso fijo abajo en la tienda de pruebas. En producción no se pinta nada. */
export default function StagingBanner() {
  if (!isStaging) return null
  return (
    <>
      <div className="h-9" aria-hidden="true" />
      <p
        role="note"
        className="fixed inset-x-0 bottom-0 z-40 bg-washed-black px-4 py-2.5 text-center text-[10px] font-medium uppercase tracking-[0.22em] text-offwhite"
      >
        Tienda en pruebas · Los pagos son simulados y no se envía nada
      </p>
    </>
  )
}

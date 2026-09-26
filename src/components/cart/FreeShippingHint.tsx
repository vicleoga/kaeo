import { formatCents } from '@/lib/catalog'

/** "Te faltan X € para el envío gratis" (umbral de la península, orientativo; el checkout calcula el real). */
export default function FreeShippingHint({ subtotal, freeFromCents }: { subtotal: number; freeFromCents: number | null }) {
  if (!freeFromCents) return <p className="text-[11px] text-washed-black/60">IVA incluido. Gastos de envío calculados en el checkout.</p>
  const missing = freeFromCents - subtotal
  const pct = Math.min(100, Math.round((subtotal / freeFromCents) * 100))
  return (
    <div>
      <p className="text-[11px] text-washed-black/70">
        {missing > 0 ? (
          <>
            Te faltan <strong className="font-medium">{formatCents(missing)}</strong> para el envío gratis a la península.
          </>
        ) : (
          'Tienes envío gratis a la península.'
        )}{' '}
        IVA incluido.
      </p>
      <div className="mt-2 h-px w-full bg-washed-black/10" aria-hidden="true">
        <div className="h-px bg-washed-black transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

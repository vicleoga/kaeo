'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, useTransition, type FormEvent, type ReactNode } from 'react'
import { useCart } from '@/context/CartContext'
import { formatCents } from '@/lib/catalog'
import { getQuote, submitOrder } from './actions'

type Quote = NonNullable<Awaited<ReturnType<typeof getQuote>>>

const KEY_STORAGE = 'kaeo:checkoutKey'

// Clave de idempotencia del intento de compra: se conserva al recargar (sessionStorage)
// para que un doble clic o un "atrás" no creen dos pedidos.
function useCheckoutKey() {
  const [key, setKey] = useState<string | null>(null)
  useEffect(() => {
    let k: string | null = null
    try {
      k = sessionStorage.getItem(KEY_STORAGE)
      if (!k) {
        k = crypto.randomUUID()
        sessionStorage.setItem(KEY_STORAGE, k)
      }
    } catch {
      k = crypto.randomUUID()
    }
    setKey(k)
  }, [])
  return key
}

function Field({ id, label, error, hint, children, className = '' }: { id: string; label: string; error?: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {children}
      {error ? (
        <p className="field-error" id={`${id}-error`}>
          {error}
        </p>
      ) : (
        hint && <p className="field-hint">{hint}</p>
      )}
    </div>
  )
}

export default function CheckoutForm({ countries }: { countries: { code: string; name: string }[] }) {
  const { lines, ready } = useCart()
  const checkoutKey = useCheckoutKey()
  const [country, setCountry] = useState(countries[0]?.code ?? 'ES')
  const [postalCode, setPostalCode] = useState('')
  const [discountInput, setDiscountInput] = useState('')
  const [discountCode, setDiscountCode] = useState('')
  const [quote, setQuote] = useState<Quote | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, startSubmit] = useTransition()

  const available = useMemo(() => lines.filter((l) => !l.unavailable), [lines])
  const items = useMemo(() => available.map((l) => ({ variantId: l.variantId, qty: l.qty })), [available])
  const itemsKey = JSON.stringify(items)

  // Presupuesto calculado en el servidor (con un pequeño retardo al escribir el código postal)
  useEffect(() => {
    if (!items.length) return
    const t = setTimeout(async () => {
      try {
        const q = await getQuote({ items, country, postalCode: postalCode.length >= 3 ? postalCode : undefined, discountCode: discountCode || undefined })
        if (q) setQuote(q)
      } catch {
        setFormError('No hemos podido calcular el total. Revisa tu conexión e inténtalo de nuevo.')
      }
    }, 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey, country, postalCode, discountCode])

  if (!ready) return <p className="py-24 text-center text-sm text-washed-black/60">Cargando…</p>
  if (available.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="text-sm text-washed-black/70">Tu carrito está vacío.</p>
        <Link href="/" className="btn-dark mt-8">
          Volver a la tienda
        </Link>
      </div>
    )
  }

  const err = (k: string) => errors[k]
  const aria = (k: string) => ({ 'aria-invalid': !!errors[k], 'aria-describedby': errors[k] ? `${k}-error` : undefined })

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!checkoutKey) return
    const f = new FormData(e.currentTarget)
    const s = (k: string) => String(f.get(k) ?? '')
    const payload = {
      checkoutKey,
      items,
      email: s('email'),
      name: s('name'),
      phone: s('phone'),
      line1: s('line1'),
      line2: s('line2'),
      postalCode,
      city: s('city'),
      province: s('province'),
      country,
      note: s('note'),
      discountCode,
      acceptTerms: f.get('acceptTerms') === 'on',
    }
    setFormError(null)
    startSubmit(async () => {
      const r = await submitOrder(payload)
      if (r.ok) {
        window.location.assign(r.redirectUrl)
        return
      }
      setErrors(r.fields ?? {})
      setFormError(r.error)
      if (r.quote) setQuote(r.quote as Quote)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }

  const summaryLines = quote?.lines ?? []

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_400px]">
      <div className="space-y-10">
        {formError && (
          <p className="alert-error" role="alert">
            {formError}
          </p>
        )}

        <fieldset className="space-y-5">
          <legend className="label mb-5">1 · Contacto</legend>
          <Field id="email" label="Email" error={err('email')} hint="Te enviaremos aquí la confirmación y el seguimiento">
            <input id="email" name="email" type="email" autoComplete="email" required className="input" {...aria('email')} />
          </Field>
          <div className="grid gap-5 md:grid-cols-2">
            <Field id="name" label="Nombre y apellidos" error={err('name')}>
              <input id="name" name="name" autoComplete="name" required className="input" {...aria('name')} />
            </Field>
            <Field id="phone" label="Teléfono (opcional)" error={err('phone')} hint="Solo para la entrega">
              <input id="phone" name="phone" type="tel" autoComplete="tel" className="input" {...aria('phone')} />
            </Field>
          </div>
        </fieldset>

        <fieldset className="space-y-5">
          <legend className="label mb-5">2 · Dirección de envío</legend>
          <Field id="line1" label="Dirección" error={err('line1')}>
            <input id="line1" name="line1" autoComplete="address-line1" required className="input" {...aria('line1')} />
          </Field>
          <Field id="line2" label="Piso, puerta… (opcional)" error={err('line2')}>
            <input id="line2" name="line2" autoComplete="address-line2" className="input" />
          </Field>
          <div className="grid gap-5 md:grid-cols-3">
            <Field id="postalCode" label="Código postal" error={err('postalCode') || quote?.shippingError || undefined}>
              <input
                id="postalCode"
                name="postalCode"
                autoComplete="postal-code"
                inputMode="numeric"
                required
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value.trim())}
                className="input"
                {...aria('postalCode')}
              />
            </Field>
            <Field id="city" label="Población" error={err('city')}>
              <input id="city" name="city" autoComplete="address-level2" required className="input" {...aria('city')} />
            </Field>
            <Field id="province" label="Provincia" error={err('province')}>
              <input id="province" name="province" autoComplete="address-level1" required className="input" {...aria('province')} />
            </Field>
          </div>
          <Field id="country" label="País" hint="Por ahora enviamos a la península y Baleares">
            <select id="country" name="country" value={country} onChange={(e) => setCountry(e.target.value)} className="input" autoComplete="country">
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field id="note" label="Nota para el pedido (opcional)">
            <textarea id="note" name="note" rows={2} maxLength={500} className="input" />
          </Field>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="label mb-5">3 · Confirmación</legend>
          <label className="flex items-start gap-3 text-sm leading-6">
            <input type="checkbox" name="acceptTerms" required className="mt-1 h-4 w-4 accent-washed-black" {...aria('acceptTerms')} />
            <span>
              He leído y acepto las{' '}
              <Link href="/legal/condiciones" target="_blank" className="underline underline-offset-4">
                condiciones de venta
              </Link>{' '}
              y la{' '}
              <Link href="/legal/privacidad" target="_blank" className="underline underline-offset-4">
                política de privacidad
              </Link>
              .
            </span>
          </label>
          {err('acceptTerms') && (
            <p className="field-error" id="acceptTerms-error">
              {err('acceptTerms')}
            </p>
          )}
        </fieldset>
      </div>

      {/* Resumen */}
      <aside className="admin-card h-fit space-y-5 lg:sticky lg:top-28" aria-label="Resumen del pedido">
        <h2 className="label">Resumen</h2>
        <ul className="divide-y divide-washed-black/10">
          {(summaryLines.length ? summaryLines : available).map((l) => {
            const line = 'productName' in l ? { key: l.sku, name: l.productName, meta: `${l.colorName} · ${l.size}`, qty: l.quantity, image: l.image, total: l.unitPriceCents * l.quantity } : { key: l.sku, name: l.name, meta: `${l.color.name} · ${l.size}`, qty: l.qty, image: l.image, total: l.priceCents * l.qty }
            return (
              <li key={line.key} className="flex gap-3 py-3">
                <div className="relative shrink-0">
                  {line.image && <img src={line.image} alt="" className="h-16 w-12 object-cover" />}
                  <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center bg-washed-black px-1 text-[10px] text-offwhite">{line.qty}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium uppercase tracking-[0.15em]">{line.name}</p>
                  <p className="text-[11px] text-washed-black/60">{line.meta}</p>
                </div>
                <p className="text-xs tabular-nums">{formatCents(line.total)}</p>
              </li>
            )
          })}
        </ul>

        <div>
          <label htmlFor="discount" className="field-label">
            Código de descuento
          </label>
          {discountCode && !quote?.discountError ? (
            <div className="flex items-center justify-between border border-sage/60 bg-sage/15 px-3 py-2 text-sm">
              <span className="font-medium uppercase tracking-[0.15em]">{discountCode}</span>
              <button
                type="button"
                onClick={() => {
                  setDiscountCode('')
                  setDiscountInput('')
                }}
                className="text-[10px] uppercase tracking-[0.2em] text-washed-black/60 hover:text-washed-black"
              >
                Quitar
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input id="discount" value={discountInput} onChange={(e) => setDiscountInput(e.target.value.toUpperCase())} className="input uppercase" placeholder="SLOWCLUB10" />
              <button type="button" onClick={() => setDiscountCode(discountInput.trim())} disabled={!discountInput.trim()} className="btn-secondary shrink-0">
                Aplicar
              </button>
            </div>
          )}
          {(quote?.discountError || err('discountCode')) && discountCode && <p className="field-error">{quote?.discountError || err('discountCode')}</p>}
        </div>

        {quote && (
          <dl className="space-y-2 border-t border-washed-black/10 pt-4 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd className="tabular-nums">{formatCents(quote.subtotalCents)}</dd>
            </div>
            {quote.discount && (
              <div className="flex justify-between text-washed-black/80">
                <dt>Descuento ({quote.discount.code} · {quote.discount.label})</dt>
                <dd className="tabular-nums">−{formatCents(quote.discount.amountCents)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt>Envío{quote.shipping ? ` · ${quote.shipping.name}` : ''}</dt>
              <dd className="tabular-nums">{quote.shipping ? (quote.shipping.free ? 'Gratis' : formatCents(quote.shipping.priceCents)) : '—'}</dd>
            </div>
            {quote.shipping?.estimatedDays && <p className="text-[11px] text-washed-black/55">Entrega estimada: {quote.shipping.estimatedDays}</p>}
            <div className="flex justify-between border-t border-washed-black/10 pt-3 text-base">
              <dt className="font-medium">Total</dt>
              <dd className="font-medium tabular-nums">{formatCents(quote.totalCents)}</dd>
            </div>
            <p className="text-[11px] text-washed-black/55">IVA incluido ({formatCents(quote.taxCents)})</p>
          </dl>
        )}
        {quote?.problems.length ? <p className="text-xs text-terracotta">{quote.problems.join(' ')}</p> : null}

        <button
          type="submit"
          disabled={submitting || !checkoutKey || !quote?.shipping || !!quote?.problems.length}
          className="w-full border border-washed-black bg-washed-black py-4 text-[11px] font-medium uppercase tracking-label text-offwhite transition-colors duration-500 hover:bg-transparent hover:text-washed-black disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-washed-black disabled:hover:text-offwhite"
        >
          {submitting ? 'Creando pedido…' : quote?.shipping ? `Pagar ${formatCents(quote.totalCents)}` : quote?.shippingError ? 'Revisa la dirección' : 'Indica tu código postal'}
        </button>
      </aside>
    </form>
  )
}

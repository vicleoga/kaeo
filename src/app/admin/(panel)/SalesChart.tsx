'use client'

import { useState } from 'react'

export interface ChartPoint {
  day: string
  revenueCents: number
  orders: number
}

const euro = (cents: number, decimals = 2) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(cents / 100)
const dayLabel = (day: string, opts: Intl.DateTimeFormatOptions) => new Date(`${day}T12:00:00Z`).toLocaleDateString('es-ES', { timeZone: 'UTC', ...opts })

/** Escala "bonita" para el eje Y: 0, paso, 2·paso… */
function niceMax(max: number) {
  if (max <= 0) return { top: 10000, step: 5000 } // 100 € por defecto con 0 ventas
  const raw = max / 4
  const pow = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw)!
  return { top: step * Math.ceil(max / step), step }
}

// Columnas de ventas diarias. Una sola serie: sin leyenda (el título la nombra).
// Marcas finas con punta redondeada, rejilla discreta, tooltip por columna y tabla accesible.
export default function SalesChart({ data }: { data: ChartPoint[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const W = 720
  const H = 220
  const pad = { top: 16, right: 8, bottom: 26, left: 56 }
  const plotW = W - pad.left - pad.right
  const plotH = H - pad.top - pad.bottom
  const max = Math.max(...data.map((d) => d.revenueCents))
  const { top, step } = niceMax(max)
  const band = plotW / data.length
  const barW = Math.min(24, Math.max(3, band * 0.62))
  const y = (v: number) => pad.top + plotH - (v / top) * plotH
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step)
  const labelEvery = Math.ceil(data.length / 8)
  const maxIndex = max > 0 ? data.findIndex((d) => d.revenueCents === max) : -1
  const total = data.reduce((n, d) => n + d.revenueCents, 0)
  const h = hover != null ? data[hover] : null

  return (
    <figure className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Ventas diarias: ${euro(total)} en ${data.length} días`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={W - pad.right} y1={y(t)} y2={y(t)} stroke="currentColor" className="text-washed-black/10" strokeWidth={1} />
            <text x={pad.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-washed-black/55 text-[10px] tabular-nums">
              {euro(t, 0)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const cx = pad.left + band * i + band / 2
          const x = cx - barW / 2
          const h0 = y(0)
          const yv = y(d.revenueCents)
          const r = Math.min(4, barW / 2, h0 - yv)
          const active = hover === i
          return (
            <g key={d.day}>
              {d.revenueCents > 0 && (
                // Punta redondeada (4px), base recta sobre el eje
                <path
                  d={`M${x},${h0} L${x},${yv + r} Q${x},${yv} ${x + r},${yv} L${x + barW - r},${yv} Q${x + barW},${yv} ${x + barW},${yv + r} L${x + barW},${h0} Z`}
                  className={active ? 'fill-washed-black' : 'fill-washed-blue'}
                />
              )}
              {i === maxIndex && (
                <text x={cx} y={yv - 6} textAnchor="middle" className="fill-washed-black text-[10px] font-medium tabular-nums">
                  {euro(d.revenueCents, 0)}
                </text>
              )}
              {i % labelEvery === 0 && (
                <text x={cx} y={H - 8} textAnchor="middle" className="fill-washed-black/55 text-[10px]">
                  {dayLabel(d.day, { day: 'numeric', month: 'short' })}
                </text>
              )}
              {/* Zona de hover/foco más grande que la marca */}
              <rect
                x={pad.left + band * i}
                y={pad.top}
                width={band}
                height={plotH}
                fill="transparent"
                tabIndex={0}
                aria-label={`${dayLabel(d.day, { weekday: 'long', day: 'numeric', month: 'long' })}: ${euro(d.revenueCents)}, ${d.orders} pedidos`}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                className="cursor-default outline-none"
              />
            </g>
          )
        })}
        <line x1={pad.left} x2={W - pad.right} y1={y(0)} y2={y(0)} stroke="currentColor" className="text-washed-black/30" strokeWidth={1} />
      </svg>

      {h && hover != null && (
        <div
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 whitespace-nowrap border border-washed-black/15 bg-offwhite px-3 py-2 text-xs shadow-sm"
          style={{ left: `${((pad.left + band * hover + band / 2) / W) * 100}%` }}
          role="status"
        >
          <p className="font-medium">{dayLabel(h.day, { weekday: 'short', day: 'numeric', month: 'short' })}</p>
          <p className="tabular-nums">{euro(h.revenueCents)}</p>
          <p className="text-washed-black/60">
            {h.orders} pedido{h.orders === 1 ? '' : 's'}
          </p>
        </div>
      )}

      <details className="mt-3 text-xs">
        <summary className="cursor-pointer text-[10px] uppercase tracking-[0.2em] text-washed-black/60 hover:text-washed-black">Ver tabla</summary>
        <table className="admin-table mt-2">
          <thead>
            <tr>
              <th>Día</th>
              <th className="text-right">Pedidos</th>
              <th className="text-right">Ventas</th>
            </tr>
          </thead>
          <tbody>
            {data
              .filter((d) => d.orders > 0)
              .map((d) => (
                <tr key={d.day}>
                  <td>{dayLabel(d.day, { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                  <td className="text-right tabular-nums">{d.orders}</td>
                  <td className="text-right tabular-nums">{euro(d.revenueCents)}</td>
                </tr>
              ))}
            {data.every((d) => d.orders === 0) && (
              <tr>
                <td colSpan={3} className="text-washed-black/60">
                  Sin ventas en estos días.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </details>
    </figure>
  )
}

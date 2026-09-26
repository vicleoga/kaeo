// Geometría del logotipo KAEO, dibujada a mano a partir del moodboard.
//
// Proporciones medidas sobre el logo original (altura de mayúscula = 100):
//   · grosor de trazo ≈ 20 (el mismo en K, Λ, E y O)
//   · K: el brazo superior llega al fuste y el inferior nace del superior (estilo Futura)
//   · Λ ≈ 123 de ancho, sin barra, con el vértice truncado (≈ 17)
//   · E ≈ 88 de ancho, tres brazos de igual longitud
//   · O círculo perfecto (r = 53.5) que rebasa la altura de mayúscula por arriba y abajo
//   · posición de cada letra copiada del original (K 0 · Λ 144.4 · E 311.8 · O 448.65)
//
// Módulo JS puro (sin React) para reutilizarlo también desde scripts.

export const CAP_HEIGHT = 100
const H = CAP_HEIGHT
const O_RADIUS = 53.5 // rebase óptico de 3.5 arriba y abajo

// ——— trazo de grosor constante a partir de una línea central ———
const EXT = 40

function offsetSegment(p, q, d) {
  const dx = q[0] - p[0]
  const dy = q[1] - p[1]
  const len = Math.hypot(dx, dy)
  const nx = (-dy / len) * d
  const ny = (dx / len) * d
  return [
    [p[0] + nx, p[1] + ny],
    [q[0] + nx, q[1] + ny],
  ]
}

function intersect([p1, p2], [p3, p4]) {
  const d = (p1[0] - p2[0]) * (p3[1] - p4[1]) - (p1[1] - p2[1]) * (p3[0] - p4[0])
  if (Math.abs(d) < 1e-9) return p2
  const a = p1[0] * p2[1] - p1[1] * p2[0]
  const b = p3[0] * p4[1] - p3[1] * p4[0]
  return [
    (a * (p3[0] - p4[0]) - (p1[0] - p2[0]) * b) / d,
    (a * (p3[1] - p4[1]) - (p1[1] - p2[1]) * b) / d,
  ]
}

function extendEnds(pts) {
  const out = pts.map((p) => [...p])
  const grow = (a, b) => {
    const dx = a[0] - b[0]
    const dy = a[1] - b[1]
    const len = Math.hypot(dx, dy)
    a[0] += (dx / len) * EXT
    a[1] += (dy / len) * EXT
  }
  grow(out[0], out[1])
  grow(out[out.length - 1], out[out.length - 2])
  return out
}

function side(pts, d) {
  const segs = []
  for (let i = 0; i < pts.length - 1; i++) segs.push(offsetSegment(pts[i], pts[i + 1], d))
  const out = [segs[0][0]]
  for (let i = 0; i < segs.length - 1; i++) out.push(intersect(segs[i], segs[i + 1]))
  out.push(segs[segs.length - 1][1])
  return out
}

function stroke(pts, weight, { extend = true } = {}) {
  const p = extend ? extendEnds(pts) : pts
  return [...side(p, weight / 2), ...side(p, -weight / 2).reverse()]
}

// Recorte Sutherland–Hodgman contra la franja [0, H]: extremos cortados en horizontal.
function clipHalf(poly, keep, crossY) {
  const out = []
  for (let i = 0; i < poly.length; i++) {
    const cur = poly[i]
    const prev = poly[(i + poly.length - 1) % poly.length]
    const inCur = keep(cur)
    const inPrev = keep(prev)
    if (inCur !== inPrev) {
      const t = (crossY - prev[1]) / (cur[1] - prev[1])
      out.push([prev[0] + (cur[0] - prev[0]) * t, crossY])
    }
    if (inCur) out.push(cur)
  }
  return out
}

const clipToCap = (poly) => clipHalf(clipHalf(poly, (p) => p[1] >= 0, 0), (p) => p[1] <= H, H)

const rect = (x0, y0, x1, y1) => [
  [x0, y0],
  [x1, y0],
  [x1, y1],
  [x0, y1],
]

// Todas las piezas se orientan en sentido horario para poder unirlas en un solo
// trazado (regla nonzero): los solapes no se suman aunque el color sea translúcido.
const clockwise = (poly) => {
  let area = 0
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i]
    const [x2, y2] = poly[(i + 1) % poly.length]
    area += x1 * y2 - x2 * y1
  }
  return area < 0 ? poly.slice().reverse() : poly
}

const polyPath = (poly, dx = 0) =>
  'M' + clockwise(poly).map(([x, y]) => `${(x + dx).toFixed(2)} ${y.toFixed(2)}`).join('L') + 'Z'

// ——— letras: cada una devuelve { width, path(dx) → string[] } con su caja empezando en x = 0.

function letterK(w) {
  const stem = rect(0, 0, w, H)
  // Brazo superior: de arriba a la derecha hasta el eje del fuste (su extremo queda oculto en él).
  const upperTop = [83.1, 0]
  const upperEnd = [w / 2, 7.5 + (74.2 - w / 2) / 1.19]
  const upper = clipToCap(stroke([[upperTop[0] + 1.19 * EXT, -EXT], upperEnd], w, { extend: false }))
  // Brazo inferior: nace dentro del brazo superior y baja a la derecha.
  const lower = clipToCap(stroke([[31.4, 38.1], [88.9 + 0.93 * EXT, H + EXT]], w, { extend: false }))
  const width = Math.max(...lower.map(([x]) => x), ...upper.map(([x]) => x))
  return { width, path: (dx) => [polyPath(stem, dx), polyPath(upper, dx), polyPath(lower, dx)] }
}

function letterLambda(w) {
  const slope = 0.531 // desplazamiento horizontal por unidad vertical de cada diagonal
  const flat = 16.8 // ancho del vértice truncado
  const band = w * Math.sqrt(1 + slope * slope) // ancho horizontal del trazo diagonal
  const topL = slope * H
  const width = 2 * topL + flat
  const cx = width / 2
  const innerY = H - (cx - band) / slope
  const poly = [
    [0, H],
    [topL, 0],
    [topL + flat, 0],
    [width, H],
    [width - band, H],
    [cx, innerY],
    [band, H],
  ]
  return { width, path: (dx) => [polyPath(poly, dx)] }
}

function letterE(w) {
  const armW = 88.2
  const midY = (H - w) / 2
  const parts = [rect(0, 0, w, H), rect(0, 0, armW, w), rect(0, midY, armW, midY + w), rect(0, H - w, armW, H)]
  return { width: armW, path: (dx) => parts.map((p) => polyPath(p, dx)) }
}

function letterO(w) {
  const R = O_RADIUS
  const r = R - w
  const cy = H / 2
  const circle = (cx, rad, sweep) =>
    `M${(cx - rad).toFixed(2)} ${cy}A${rad} ${rad} 0 1 ${sweep} ${(cx + rad).toFixed(2)} ${cy}A${rad} ${rad} 0 1 ${sweep} ${(cx - rad).toFixed(2)} ${cy}Z`
  // Exterior en sentido horario e interior en antihorario → hueco con la regla nonzero.
  return { width: 2 * R, path: (dx) => [circle(dx + R, R, 1) + circle(dx + R, r, 0)] }
}

// Posición horizontal de cada letra, medida sobre el logo del moodboard.
const POSITIONS = [0, 144.4, 311.8, 448.65]

/**
 * Construye el logotipo KAEO.
 * @returns {{ width: number, height: number, top: number, path: string }}
 *   `top` es negativo: la O rebasa la altura de mayúscula.
 */
export function buildLogo({ weight = 20 } = {}) {
  const letters = [letterK(weight), letterLambda(weight), letterE(weight), letterO(weight)]
  const path = letters.flatMap((l, i) => l.path(POSITIONS[i])).join('')
  const last = letters.length - 1
  const overshoot = O_RADIUS - H / 2
  return { width: POSITIONS[last] + letters[last].width, height: H + 2 * overshoot, top: -overshoot, path }
}

export const LOGO = buildLogo()

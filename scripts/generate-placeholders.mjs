// Genera ilustraciones placeholder (flat lay) para las prendas de KAEO que aún
// no tienen foto: las que en src/data/products.js llevan `garment`.
// El resto de imágenes provisionales son recortes del moodboard
// (scripts/crop_moodboard.py). Ver IMAGENES.md para las fotos definitivas.
//
//   npm run images

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CAP_HEIGHT, LOGO } from '../src/lib/logoGeometry.js'
import { PRODUCTS } from '../src/data/products.js'
import { PALETTE } from '../src/data/palette.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'images')

// ——— utilidades de color ———
const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const rgbToHex = (rgb) => '#' + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')
const mix = (a, b, t) => rgbToHex(hexToRgb(a).map((v, i) => v + (hexToRgb(b)[i] - v) * t))
const shade = (c, t) => (t < 0 ? mix(c, '#1c1a17', -t) : mix(c, '#ffffff', t))
const luminance = (c) => {
  const [r, g, b] = hexToRgb(c)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

const C = {
  offwhite: '#F7F5EF',
  sand: '#D9C9B1',
  sage: '#8A9B8F',
  blue: '#5C7A8A',
  black: '#2E2E2E',
}

let uid = 0
const id = (p) => `${p}${++uid}`

function svg(w, h, body, { grain = 0.14 } = {}) {
  const g = id('grain')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
<defs>
  <filter id="${g}" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/>
    <feColorMatrix type="saturate" values="0"/>
  </filter>
</defs>
${body}
<rect width="${w}" height="${h}" filter="url(#${g})" opacity="${grain}" style="mix-blend-mode:multiply"/>
</svg>`
}

function write(rel, content) {
  const file = join(ROOT, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, content)
  console.log('  ✓', rel)
}

// Logo KAEO como grupo SVG, escalado a una altura de mayúsculas dada.
function logo(x, y, capHeight, color) {
  const s = capHeight / CAP_HEIGHT
  return `<g transform="translate(${x} ${y}) scale(${s})" fill="${color}"><path d="${LOGO.path}"/></g>`
}
const logoWidth = (capHeight) => (LOGO.width * capHeight) / CAP_HEIGHT

const FONT = `font-family="Jost, Futura, 'Century Gothic', 'Avenir Next', Arial, sans-serif" font-weight="500"`

function textLines(lines, cx, y, size, color, spacing = 0.3, lh = 1.6) {
  return lines
    .map(
      (l, i) =>
        `<text x="${cx}" y="${y + i * size * lh}" text-anchor="middle" ${FONT} font-size="${size}" letter-spacing="${size * spacing}" fill="${color}">${l}</text>`,
    )
    .join('')
}

// ——— estampados ———
function palmPrint(cx, cy, s, color) {
  const fronds = [-150, -120, -85, -55, -20, 15, 45, 80, 115]
    .map((a) => {
      const rad = (a * Math.PI) / 180
      const ex = Math.sin(rad) * 95
      const ey = -Math.cos(rad) * 60 + Math.abs(Math.sin(rad)) * 30
      let leaves = ''
      for (let k = 1; k < 7; k++) {
        const t = k / 7
        const px = ex * t
        const py = ey * t - Math.sin(t * Math.PI) * 18
        leaves += `<path d="M${px} ${py} l${-8 + (a > 0 ? 4 : -4)} ${14}" />`
        leaves += `<path d="M${px} ${py} l${8 + (a > 0 ? 4 : -4)} ${12}" />`
      }
      return `<path d="M0 0 Q${ex * 0.5} ${ey * 0.5 - 22} ${ex} ${ey}"/>${leaves}`
    })
    .join('')
  return `<g transform="translate(${cx} ${cy}) scale(${s})" stroke="${color}" stroke-width="2.2" fill="none" stroke-linecap="round">
${fronds}
<path d="M0 0 C6 60 -4 120 12 190" stroke-width="4"/>
<path d="M-60 192 L80 192" />
<path d="M-20 172 q8 -6 16 0 q8 6 16 0" />
</g>`
}

// ——— prendas (flat lay 600×750) ———
const mirror = (pts) => [...pts, ...pts.slice().reverse().map(([x, y]) => [600 - x, y])]
const poly = (pts) => 'M' + pts.map(([x, y]) => `${x} ${y}`).join(' L') + ' Z'

function garmentFrame(color, shapePath, details) {
  const light = luminance(color) > 0.8
  const bg = light ? '#E7DFD1' : '#EEE8DD'
  const clip = id('g')
  const grad = id('lg')
  const sh = id('sh')
  return svg(
    600,
    750,
    `<rect width="600" height="750" fill="${bg}"/>
<defs>
  <clipPath id="${clip}"><path d="${shapePath}"/></clipPath>
  <linearGradient id="${grad}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.22"/><stop offset="0.5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.12"/></linearGradient>
  <filter id="${sh}" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#3a2f22" flood-opacity="0.18"/></filter>
</defs>
<path d="${shapePath}" fill="${color}" filter="url(#${sh})"/>
<g clip-path="url(#${clip})">
  ${details}
  <rect width="600" height="750" fill="url(#${grad})"/>
</g>`,
    { grain: 0.16 },
  )
}

const inkOn = (color) => (luminance(color) < 0.45 ? '#F1ECE2' : shade(color, -0.55))

function teeShape() {
  return poly(mirror([[300, 150], [240, 140], [145, 165], [55, 282], [122, 318], [156, 270], [148, 645]]))
}

function tee(color, print) {
  const fold = shade(color, -0.09)
  let d = `<path d="M240 140 Q300 160 360 140 Q300 188 240 140 Z" fill="${shade(color, -0.2)}"/>
<path d="M240 140 Q300 188 360 140" stroke="${shade(color, -0.12)}" stroke-width="9" fill="none"/>
<path d="M122 318 L156 270 M478 318 L444 270" stroke="${fold}" stroke-width="3"/>
<path d="M205 330 Q235 480 215 640 M395 360 Q370 500 392 640" stroke="${fold}" stroke-width="3" fill="none" opacity="0.6"/>
<path d="M148 628 L452 628" stroke="${fold}" stroke-width="2" opacity="0.7"/>`
  if (print === 'chest-logo') d += logo(345, 238, 11, inkOn(color))
  return garmentFrame(color, teeShape(), d)
}

function teeBack(color, print) {
  const ink = inkOn(color)
  let d = `<path d="M240 140 Q300 156 360 140" stroke="${shade(color, -0.12)}" stroke-width="9" fill="none"/>
<path d="M122 318 L156 270 M478 318 L444 270" stroke="${shade(color, -0.09)}" stroke-width="3"/>
<path d="M210 360 Q240 500 220 640 M390 330 Q365 480 385 640" stroke="${shade(color, -0.09)}" stroke-width="3" fill="none" opacity="0.6"/>
<path d="M148 628 L452 628" stroke="${shade(color, -0.09)}" stroke-width="2" opacity="0.7"/>`
  if (print === 'palm') d += palmPrint(300, 285, 0.95, ink) + textLines(['SLOW DAYS'], 300, 510, 13, ink, 0.45)
  else if (Array.isArray(print)) d += textLines(print, 300, 262, 19, ink, 0.34, 1.75) + `<rect x="285" y="${262 + print.length * 33}" width="30" height="1.5" fill="${ink}"/>`
  d += textLines(['KAEO'], 300, 196, 7, ink, 0.6)
  return garmentFrame(color, teeShape(), d)
}

function sweatshirt(color, print) {
  const shape = poly(mirror([[300, 150], [242, 140], [150, 172], [70, 520], [58, 585], [106, 594], [122, 530], [152, 300], [150, 648]]))
  const f = shade(color, -0.1)
  let d = `<path d="M240 140 Q300 162 360 140 Q300 192 240 140 Z" fill="${shade(color, -0.22)}"/>
<path d="M240 140 Q300 192 360 140" stroke="${f}" stroke-width="12" fill="none"/>
<path d="M150 604 L450 604 M66 556 L118 566 M534 556 L482 566" stroke="${f}" stroke-width="3"/>
<g stroke="${f}" stroke-width="1.5" opacity="0.6">${Array.from({ length: 30 }, (_, i) => `<path d="M${156 + i * 10} 606 L${156 + i * 10} 648"/>`).join('')}</g>
<path d="M152 300 L150 604 M448 300 L450 604" stroke="${f}" stroke-width="2" opacity="0.5"/>
<path d="M215 340 Q245 470 225 600 M390 360 Q368 480 385 600" stroke="${f}" stroke-width="3" fill="none" opacity="0.5"/>`
  if (print === 'chest-logo') d += logo(300 - logoWidth(14) / 2, 250, 14, inkOn(color))
  return garmentFrame(color, shape, d)
}

function shirt(color) {
  const shape = `M300 150 L262 132 L150 168 L72 520 L62 588 L112 596 L126 532 L156 300 L152 612 Q300 680 448 612 L444 300 L474 532 L488 596 L538 588 L528 520 L450 168 L338 132 Z`
  const f = shade(color, -0.12)
  const buttons = [210, 290, 370, 450, 530, 600].map((y) => `<circle cx="300" cy="${y}" r="5" fill="${shade(color, 0.35)}" stroke="${f}" stroke-width="1"/>`).join('')
  const d = `<path d="M262 132 L300 150 L338 132 L330 128 L300 138 L270 128 Z" fill="${shade(color, -0.25)}"/>
<path d="M262 132 L236 196 L300 162 Z M338 132 L364 196 L300 162 Z" fill="${shade(color, 0.08)}" stroke="${f}" stroke-width="2"/>
<path d="M288 162 L288 650 M312 162 L312 650" stroke="${f}" stroke-width="2"/>
${buttons}
<path d="M190 240 L250 240 L250 305 L190 305 Z" fill="none" stroke="${f}" stroke-width="2"/>
<path d="M66 552 L118 562 M534 552 L482 562" stroke="${f}" stroke-width="3"/>
<path d="M210 330 Q235 470 215 620 M395 340 Q370 480 390 625" stroke="${f}" stroke-width="3" fill="none" opacity="0.5"/>
<g stroke="${shade(color, -0.05)}" stroke-width="1" opacity="0.5">${Array.from({ length: 50 }, (_, i) => `<path d="M0 ${140 + i * 11 + (i % 3)} L600 ${140 + i * 11}"/>`).join('')}</g>`
  return garmentFrame(color, shape, d)
}

function pants(color) {
  const shape = `M188 120 L412 120 L414 168 L462 660 L318 660 L300 330 L282 660 L138 660 L186 168 Z`
  const f = shade(color, -0.12)
  const d = `<path d="M188 120 L412 120 L414 168 L186 168 Z" fill="${shade(color, -0.06)}"/>
<g stroke="${f}" stroke-width="1.5" opacity="0.7">${Array.from({ length: 22 }, (_, i) => `<path d="M${196 + i * 10} 124 L${196 + i * 10} 166"/>`).join('')}</g>
<path d="M288 150 Q280 210 268 240 M312 150 Q322 210 336 236" stroke="${shade(color, 0.35)}" stroke-width="3" fill="none"/>
<path d="M300 170 L300 330" stroke="${f}" stroke-width="2"/>
<path d="M220 200 Q250 420 215 655 M380 200 Q352 420 388 655" stroke="${f}" stroke-width="3" fill="none" opacity="0.55"/>
<path d="M140 640 L282 640 M318 640 L460 640" stroke="${f}" stroke-width="2"/>`
  return garmentFrame(color, shape, d)
}

function dress(color) {
  const shape = `M232 196 Q300 214 368 196 L356 330 Q430 450 470 672 Q300 700 130 672 Q170 450 244 330 Z`
  const f = shade(color, -0.12)
  const d = `<path d="M244 330 Q300 344 356 330" stroke="${f}" stroke-width="3" fill="none"/>
<path d="M280 340 Q270 380 256 410 M296 342 Q300 385 290 420" stroke="${f}" stroke-width="3" fill="none"/>
<path d="M270 350 Q230 520 190 675 M300 350 L300 690 M330 350 Q370 520 410 680" stroke="${f}" stroke-width="3" fill="none" opacity="0.5"/>
<path d="M232 196 Q300 214 368 196" stroke="${f}" stroke-width="4" fill="none"/>`
  // Tirantes y colgador por encima del marco
  return garmentFrame(color, shape, d).replace('</svg>', '').concat(`<path d="M240 198 L252 90 M360 198 L348 90" stroke="${shade(color, -0.1)}" stroke-width="5"/><path d="M252 90 L348 90" stroke="#8a7a62" stroke-width="3" opacity="0.6"/><path d="M300 90 L300 72" stroke="#8a7a62" stroke-width="3" opacity="0.6"/></svg>`)
}

function knit(color) {
  const shape = poly(mirror([[300, 196], [210, 180], [138, 200], [100, 288], [148, 310], [160, 280], [158, 560]]))
  const f = shade(color, -0.12)
  const ribs = Array.from({ length: 60 }, (_, i) => `<path d="M${100 + i * 7} 170 L${100 + i * 7} 570"/>`).join('')
  const d = `<g stroke="${f}" stroke-width="1.6" opacity="0.55">${ribs}</g>
<path d="M210 180 Q300 205 390 180" stroke="${shade(color, -0.15)}" stroke-width="10" fill="none"/>
<path d="M158 530 L442 530" stroke="${f}" stroke-width="3"/>`
  return garmentFrame(color, shape, d)
}

const GARMENTS = { tee, 'tee-back': teeBack, sweatshirt, shirt, pants, dress, knit }

function favicon() {
  const cap = 12
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#2E2E2E"/>${logo(32 - logoWidth(cap) / 2, 32 - cap / 2, cap, '#F7F5EF')}</svg>`
}

// ——— salida ———
console.log('Generando ilustraciones placeholder…')
for (const p of PRODUCTS.filter((p) => p.garment)) {
  write(p.image.replace(/^images\//, ''), GARMENTS[p.garment](PALETTE[p.color].hex, p.print))
}
writeFileSync(join(ROOT, '..', 'favicon.svg'), favicon())
console.log('Listo.')

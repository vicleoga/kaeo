# KAEO — Clothes for a brighter tomorrow

Web de la marca **KAEO**: camisetas y básicos de estilo mediterráneo, minimalista y *slow living*.
Todo el diseño parte del moodboard oficial de la marca (`public/images/moodboard/kaeo-moodboard.webp`).

## 👉 Ver la web

**https://vicleoga.github.io/kaeo/**

(Publicada gratis con GitHub Pages. Para retirarla, desactiva Pages en *Settings → Pages* o borra la rama `gh-pages`.)

---

## Stack

- React 19 + Vite
- Tailwind CSS 3 (paleta y tipografías de marca en `tailwind.config.js`)
- Carrito lateral, buscador y animaciones de scroll con React puro, sin librerías extra

## Identidad

| Color | Hex |
|---|---|
| Off White | `#F7F5EF` |
| Sand | `#D9C9B1` |
| Sage | `#8A9B8F` |
| Washed Blue | `#5C7A8A` |
| Washed Black | `#2E2E2E` |

Tipografías (Google Fonts): **Jost** para títulos y etiquetas y **Mrs Saint Delafield** para las frases manuscritas.

### El logo

`src/components/Logo.jsx` dibuja **K Λ E O** en SVG. La geometría (`src/lib/logoGeometry.js`) se midió sobre
el logo del moodboard y coincide con él con menos de un 1 % de error:
Λ sin barra y con el vértice truncado, E con tres brazos iguales, O circular con rebase óptico y el mismo grosor de trazo en todas las letras.

```jsx
<Logo size={32} />                  // hereda el color del texto; size = altura de las mayúsculas
<Logo color="#F7F5EF" size={96} />  // blanco sobre foto
<h2><KaeoWord /> Journal</h2>       // la palabra KAEO dentro de un titular
```

## Estructura

```
src/
  components/   Navbar, Hero, Manifesto, CategorySection, ProductCard, Palette,
                Gallery, Newsletter, Footer, CartDrawer, SearchOverlay, Logo…
  context/      CartContext (estado del carrito)
  data/         products.js (catálogo), palette.js
  lib/          logoGeometry.js, asset.js
public/images/  imágenes provisionales (ver IMAGENES.md)
scripts/        crop_moodboard.py, generate-placeholders.mjs
```

## Imágenes

Son provisionales: recortes del moodboard (`python scripts/crop_moodboard.py`, requiere Pillow y numpy) e
ilustraciones para las prendas sin foto (`npm run images`). En [IMAGENES.md](IMAGENES.md) está la lista
completa, con un prompt en inglés para generar cada foto definitiva.

## Desarrollo

```bash
npm install
npm run dev       # servidor local
npm run build     # build de producción en dist/
npm run deploy    # compila y publica en GitHub Pages (rama gh-pages)
```

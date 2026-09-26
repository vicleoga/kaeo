# KAEO — Clothes for a brighter tomorrow

Tienda online de **KAEO**: camisetas y básicos de estilo mediterráneo, minimalista y *slow living*.
Todo el diseño parte del moodboard oficial de la marca (`public/images/moodboard/kaeo-moodboard.webp`).

> **Estado:** en migración de landing estática a tienda completa (Next.js + PostgreSQL), por fases.
> Fase actual: **1 — nuevo stack con la landing funcionando igual**.
> La versión estática anterior sigue publicada en https://vicleoga.github.io/kaeo/ (rama `gh-pages`,
> congelada) hasta que la tienda esté desplegada en Hetzner.

---

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Tailwind CSS 3** con la paleta y tipografías de marca (`tailwind.config.js`)
- **PostgreSQL 16** (se usará a partir de la fase 2, con Prisma)
- **Docker / docker compose** para ejecutar todo igual en local y en el servidor
- Fuentes Jost y Mrs Saint Delafield **autoalojadas** con `next/font` (sin peticiones a Google desde el navegador)

## Arrancar en local

Requisitos: Node 20.9+ (recomendado 24) y Docker Desktop.

```bash
cp .env.example .env          # y revisa los valores
npm install
npm run dev                   # http://localhost:3000
```

La base de datos (necesaria a partir de la fase 2) se levanta aparte con Docker:

```bash
docker compose -f docker-compose.dev.yml up -d
```

### Todo con Docker (como en producción)

```bash
cp .env.example .env          # cambia POSTGRES_PASSWORD
docker compose up -d --build  # app en http://localhost:3000 + PostgreSQL
docker compose ps             # ambos servicios deben salir "healthy"
docker compose logs -f app    # ver logs
docker compose down           # parar (los datos de la BD se conservan en el volumen pgdata)
```

`GET /api/health` devuelve `{"status":"ok"}` y lo usa el healthcheck del contenedor.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Build de producción y servidor |
| `npm run typecheck` | Comprobación de tipos con TypeScript |
| `npm run images` | Regenera las ilustraciones de las prendas sin foto |
| `npm run images:crop` | Vuelve a recortar las fotos del moodboard (requiere Python con Pillow y numpy) |

## Variables de entorno

Todas están documentadas en [`.env.example`](.env.example). `.env` no se sube nunca a git.
Las que empiezan por `NEXT_PUBLIC_` se incrustan al compilar: si cambian, hay que reconstruir la imagen.

## Identidad

| Color | Hex |
|---|---|
| Off White | `#F7F5EF` |
| Sand | `#D9C9B1` |
| Sage | `#8A9B8F` |
| Washed Blue | `#5C7A8A` |
| Washed Black | `#2E2E2E` |

### El logo

`src/components/Logo.tsx` dibuja **K Λ E O** en SVG. La geometría (`src/lib/logoGeometry.js`) se midió sobre
el logo del moodboard: Λ sin barra y con el vértice truncado, E con tres brazos iguales, O circular con rebase
óptico y el mismo grosor de trazo en todas las letras.

```tsx
<Logo size={32} />                  // hereda el color del texto; size = altura de las mayúsculas
<Logo color="#F7F5EF" size={96} />  // blanco sobre foto
<h2><KaeoWord /> Journal</h2>       // la palabra KAEO dentro de un titular
```

## Estructura

```
src/
  app/
    layout.tsx          fuentes, metadatos, proveedor del carrito
    globals.css         estilos base de marca (textura de papel, .label, .btn, .divider)
    (tienda)/           páginas públicas: layout (navbar, carrito, buscador, footer) y portada
    api/health/         healthcheck
  components/           Hero, Manifesto, CategorySection, ProductCard, Palette, Gallery,
                        Newsletter, Footer, CartDrawer, SearchOverlay, SiteChrome, Logo…
  context/              CartContext (carrito; en la fase 3 pasa a guardar talla y persistir)
  data/                 products.ts, palette.ts (en la fase 2 pasan a ser el seed de la BD)
  lib/                  logoGeometry.js
public/images/          imágenes provisionales (ver IMAGENES.md)
scripts/                crop_moodboard.py, generate-placeholders.mjs
Dockerfile, docker-compose.yml, docker-compose.dev.yml, .env.example
```

## Imágenes

Son provisionales: recortes del moodboard e ilustraciones para las prendas sin foto. En
[IMAGENES.md](IMAGENES.md) está la lista completa, con un prompt en inglés para generar cada foto definitiva.

## Despliegue

Se documentará en la fase 6 (Hetzner + Docker + Caddy con HTTPS + copias de seguridad).

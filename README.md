# KAEO — Clothes for a brighter tomorrow

Tienda online de **KAEO**: camisetas y básicos de estilo mediterráneo, minimalista y *slow living*.
Todo el diseño parte del moodboard oficial de la marca (`public/images/moodboard/kaeo-moodboard.webp`).

> **Estado:** en migración de landing estática a tienda completa (Next.js + PostgreSQL), por fases.
> Hecho: **1** nuevo stack · **2** base de datos y administración de productos · **3** catálogo, ficha y carrito con tallas.
> Siguiente: 4 checkout y pedidos.
> La versión estática anterior sigue publicada en https://vicleoga.github.io/kaeo/ (rama `gh-pages`,
> congelada) hasta que la tienda esté desplegada en Hetzner.

---

## Stack

- **Next.js 16** (App Router, server actions) + React 19 + TypeScript
- **PostgreSQL 16** + **Prisma 7** (esquema, migraciones y seed)
- **Tailwind CSS 3** con la paleta y tipografías de marca (`tailwind.config.js`)
- **zod** para validar en el servidor · **argon2id** para las contraseñas · **sharp** para las fotos
- **Docker / docker compose** para ejecutar todo igual en local y en el servidor
- Fuentes Jost y Mrs Saint Delafield **autoalojadas** con `next/font` (sin peticiones a Google)

## Arrancar en local

Requisitos: Node 20.9+ (recomendado 24) y Docker Desktop.

### Opción A — Todo con Docker (como en producción)

```bash
cp .env.example .env                                   # cambia POSTGRES_PASSWORD (solo letras y números)
docker compose up -d --build                           # migraciones + app en http://localhost:3000
docker compose run --rm migrate npm run db:seed        # catálogo de ejemplo (16 productos)
docker compose run --rm migrate npm run admin:create -- --email tu@correo.com --name "Tu nombre"
```

`admin:create` genera una contraseña aleatoria y la muestra **una sola vez** (o pásale `--password`).
Si el email ya existe, cambia su contraseña y cierra sus sesiones.

```bash
docker compose ps             # app y db "healthy", migrate "Exited (0)"
docker compose logs -f app    # ver logs
docker compose down           # parar (BD y fotos se conservan en los volúmenes pgdata y uploads)
```

### Opción B — Desarrollo (app en tu máquina, base de datos en Docker)

```bash
cp .env.example .env
npm install
docker compose -f docker-compose.dev.yml up -d   # PostgreSQL en 127.0.0.1:5432 (proyecto "kaeo-dev")
npm run db:migrate                               # aplica/crea migraciones
npm run db:seed
npm run admin:create -- --email tu@correo.com
npm run dev                                      # http://localhost:3000 · admin en /admin
```

`GET /api/health` devuelve `{"status":"ok","db":"ok"}` y lo usa el healthcheck del contenedor.

## Tienda

| Ruta | Qué es |
|---|---|
| `/` | Portada (la landing original, con los productos destacados de la BD) |
| `/hombre`, `/mujer` | Catálogo con filtros de color y talla y orden (en la URL: `?color=sage&talla=M&orden=precio-asc`) |
| `/producto/[slug]` | Ficha: galería que cambia con el color, selector de color y talla (agotadas tachadas, aviso de últimas unidades), guía de tallas, composición y cuidados, relacionados. Metadatos SEO/Open Graph y datos estructurados schema.org (`Product`, `AggregateOffer`, `BreadcrumbList`) |
| `/carrito` | Carrito completo (también hay carrito lateral) |
| `/sitemap.xml`, `/robots.txt` | Para buscadores |

**Carrito:** cada línea es una variante (talla + color). Se guarda en el navegador (sigue ahí al volver y se
sincroniza entre pestañas), pero **el servidor es la fuente de verdad**: al cargar y al abrir el carrito se
revalidan precio, stock y si el producto sigue publicado, se ajustan las cantidades y se avisa de los cambios.
Máximo 10 unidades por línea y nunca más que el stock en productos de stock propio.

## Panel de administración (`/admin`)

- **Dashboard**: productos publicados y borradores, variantes activas, avisos de stock bajo y estado de las zonas de envío.
- **Productos**: listado con búsqueda (nombre, código o SKU) y filtros; crear, editar y borrar.
  - Precio con IVA incluido, IVA propio opcional (vacío = 21 % general), borrador/publicado.
  - **Tallas propias de cada producto** (dependen de la prenda del proveedor) y **guía de tallas** en texto
    (`Talla | Pecho | Largo`, una fila por línea).
  - Colores → al guardar se generan las **variantes talla × color** con SKU automático (`KA0007-SGE-M`).
    Si quitas una talla o un color, sus variantes se **desactivan** (no se borran).
  - Cada variante: SKU editable, precio propio opcional, stock, umbral de aviso y referencia en el proveedor.
  - **Fotos**: subida múltiple, texto alternativo, color asociado (la tarjeta cambia de foto al elegir ese color)
    y orden. Se convierten a WebP (1600 y 600 px) y se eliminan los datos EXIF.
  - Bajo demanda (sin límite de stock) o stock propio.
- **Inventario**: stock por variante de los productos con stock propio, filtro de stock bajo y guardado en bloque.

Pedidos, clientes, descuentos, newsletter y configuración (zonas de envío, IVA, empresa) llegan en las fases 4 y 5.

### Seguridad

- Contraseñas con **argon2id**; mínimo 8 caracteres (recomendable más largas cuando el admin esté en internet).
- Se entra con **nombre de usuario o email** (`npm run admin:create -- --username nombre` o `--email …`).
- Sesión en base de datos: token aleatorio en cookie `httpOnly` + `SameSite=Lax` (+ `Secure` con HTTPS);
  en la BD solo se guarda su hash. Caducan a las 12 h.
- **Límite de intentos de login**: 5 por email y 20 por IP cada 15 minutos (contador atómico en PostgreSQL).
  Mensaje de error genérico y tiempo de respuesta igual exista o no el email.
- Todas las operaciones del admin son server actions que **comprueban la sesión** una a una (no solo la página)
  y **validan en el servidor** con zod. Next.js rechaza las server actions cuyo `Origin` no coincide con el
  `Host` (protección **CSRF**).
- Fotos: se decodifican con sharp (un fichero que no es imagen se rechaza aunque se llame `.jpg`),
  máx. 15 MB; la ruta `/media/…` no permite salir de la carpeta de subidas.
- El admin no se indexa (`noindex`).

## Base de datos

Esquema en [`prisma/schema.prisma`](prisma/schema.prisma). Importes en **céntimos con IVA incluido**;
IVA en puntos básicos (2100 = 21 %).

| Modelo | Para qué |
|---|---|
| `Product`, `Variant`, `ProductImage`, `Color` | Catálogo |
| `AdminUser`, `Session`, `RateLimit` | Acceso al panel |
| `Setting` | IVA general, datos de la empresa… |
| `ShippingZone` | Zonas de envío activables: Península y Baleares **activas**; Canarias y UE preparadas pero **desactivadas** |

Cambiar el esquema: edita `schema.prisma` y ejecuta `npm run db:migrate -- --name descripcion-del-cambio`.
En Docker, las migraciones pendientes se aplican solas al arrancar (servicio `migrate`).

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Build de producción y servidor |
| `npm run typecheck` | Comprobación de tipos |
| `npm run db:migrate` | Crea/aplica migraciones (desarrollo) |
| `npm run db:deploy` | Aplica migraciones pendientes (producción) |
| `npm run db:seed` | Datos de prueba (idempotente: no pisa lo editado en el admin) |
| `npm run db:studio` | Explorador visual de la base de datos (Prisma Studio) |
| `npm run admin:create -- --email …` | Crea un administrador o cambia su contraseña |
| `npm run images` | Regenera las ilustraciones de las prendas sin foto |
| `npm run images:crop` | Vuelve a recortar las fotos del moodboard (Python con Pillow y numpy) |

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
prisma/                 schema.prisma, migrations/, seed.ts
src/
  app/
    layout.tsx          fuentes, metadatos, proveedor del carrito
    globals.css         estilos de marca y de formularios/admin
    (tienda)/           páginas públicas (leen el catálogo de la BD)
    admin/              login + (panel)/ dashboard, productos, inventario
    api/health/         healthcheck
    media/[...path]/    sirve las fotos subidas
  components/           componentes de la tienda (Hero, ProductCard, CartDrawer…)
  context/              CartContext (en la fase 3 pasa a guardar talla y persistir)
  data/                 products.ts, palette.ts → datos de prueba del seed
  lib/                  utilidades puras (catalog, logoGeometry, types, validation/)
  server/               solo servidor: db, auth, password, rateLimit, catalog, products,
                        images, storage/ (interfaz StorageProvider + implementación local)
  generated/            cliente de Prisma (generado, no se versiona)
scripts/                create-admin.ts, crop_moodboard.py, generate-placeholders.mjs
Dockerfile, docker-compose.yml, docker-compose.dev.yml, .env.example
```

## Imágenes

Las del catálogo de ejemplo son provisionales: recortes del moodboard e ilustraciones para las prendas sin foto.
En [IMAGENES.md](IMAGENES.md) está la lista completa, con un prompt en inglés para generar cada foto definitiva.
Las fotos reales se suben desde el admin.

## Despliegue

Cualquier servidor Linux con Docker (x86 o ARM64) sirve: hoy **staging.kaeo.es** corre en una
**Raspberry Pi 5** en casa; para el lanzamiento se recomienda un VPS (p. ej. Hetzner). Los pasos son los mismos.

La web se publica con **Cloudflare Tunnel**: el servidor abre una conexión *saliente* hacia Cloudflare,
que sirve la web con HTTPS. No hay que abrir puertos del router ni tener IP fija, y la app solo
escucha en `127.0.0.1` (no es accesible desde fuera salvo por el túnel).

### 1. Servidor

Ubuntu Server 24.04 con acceso SSH por clave. Preparación (una vez):

- Actualizaciones de seguridad automáticas (`unattended-upgrades`).
- Cortafuegos `ufw`: todo cerrado salvo SSH desde la red local.
- Docker desde el repositorio oficial (`docker-ce` + `docker-compose-plugin`), con logs limitados a 30 MB.
- En Raspberry Pi por Wi-Fi: desactivar el ahorro de energía del Wi-Fi y añadir DNS de respaldo.

### 2. Túnel en Cloudflare (dominio ya gestionado por Cloudflare)

1. Cloudflare → **Zero Trust** → **Networks** → **Tunnels** → **Create a tunnel** → *Cloudflared*.
2. Nombre, p. ej. `kaeo-staging`. En "Install connector" elige **Docker** y copia **solo el token**
   (la cadena larga que va después de `--token`).
3. **Public hostname**: subdominio `staging`, dominio `kaeo.es`, servicio **HTTP** → `app:3000`.

### 3. Aplicación

```bash
git clone -b migracion-next https://github.com/vicleoga/kaeo.git && cd kaeo
cp .env.example .env
```

En `.env` (contraseñas largas y aleatorias: `openssl rand -hex 24`):

```ini
NEXT_PUBLIC_SITE_URL=https://staging.kaeo.es
NEXT_PUBLIC_SITE_ENV=staging          # production en la tienda real
POSTGRES_PASSWORD=<aleatoria>
DATABASE_URL=postgresql://kaeo:<la misma>@localhost:5432/kaeo?schema=public
COMPOSE_PROFILES=tunnel
CLOUDFLARE_TUNNEL_TOKEN=<token del paso 2>
PAYMENT_WEBHOOK_SECRET=<aleatoria>
FULFILLMENT_WEBHOOK_SECRET=<aleatoria>
```

```bash
docker compose up -d --build                                  # la primera vez tarda (compila)
docker compose run --rm migrate npm run db:seed               # opcional: catálogo de ejemplo
docker compose run --rm migrate npm run admin:create -- --username <usuario> --password '<contraseña>'
```

### 4. Copias de seguridad

`scripts/backup.sh` guarda la base de datos y las fotos en `~/kaeo-backups` (se conservan 14 días) y
`scripts/restore.sh` las recupera. En el servidor se programan a diario con un temporizador systemd
(`kaeo-backup.timer`, 03:30). Conviene copiar de vez en cuando `~/kaeo-backups` fuera del servidor.

### 5. Actualizar a una versión nueva

```bash
cd ~/kaeo && git pull && docker compose up -d --build   # las migraciones se aplican solas
```

# KAEO — Clothes for a brighter tomorrow

Tienda online de **KAEO**: camisetas y básicos de estilo mediterráneo, minimalista y *slow living*.
Todo el diseño parte del moodboard oficial de la marca (`public/images/moodboard/kaeo-moodboard.webp`).

> **Estado:** en migración de landing estática a tienda completa (Next.js + PostgreSQL), por fases.
> Hecho: **1** nuevo stack · **2** base de datos y administración de productos · **3** catálogo, ficha y carrito con tallas ·
> **4** checkout, pedidos, pagos y producción (simulados), descuentos y configuración.
> Siguiente: 5 emails, newsletter y páginas legales. Pruebas en https://staging.kaeo.es
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
| `/nosotros` | La marca |
| `/contacto` | Formulario de contacto (antispam con campo trampa y límite de 5 mensajes/hora por IP) |
| `/preguntas-frecuentes`, `/envios-y-devoluciones` | Ayuda. Los precios y plazos de envío salen de las zonas activas de Configuración |
| `/legal/aviso-legal`, `/legal/condiciones`, `/legal/privacidad`, `/legal/cookies` | Textos legales **de partida**: los datos de empresa salen de Configuración y lo que debe validar la gestoría aparece resaltado como **[REVISAR]** (búscalo en `src/app/(tienda)/legal` y `envios-y-devoluciones`). No debe quedar ninguno antes de abrir al público |
| `/sitemap.xml`, `/robots.txt` | Para buscadores |

**Carrito:** cada línea es una variante (talla + color). Se guarda en el navegador (sigue ahí al volver y se
sincroniza entre pestañas), pero **el servidor es la fuente de verdad**: al cargar y al abrir el carrito se
revalidan precio, stock y si el producto sigue publicado, se ajustan las cantidades y se avisa de los cambios.
Máximo 10 unidades por línea y nunca más que el stock en productos de stock propio.

## Panel de administración (`/admin`)

- **Productos**: listado con búsqueda (nombre, código o SKU) y filtros; crear, editar y borrar.
  - Precio con IVA incluido, IVA propio opcional (vacío = 21 % general), borrador/publicado.
  - **Tallas propias de cada producto** (dependen de la prenda del proveedor) y **guía de tallas** en texto
    (`Talla | Pecho | Largo`, una fila por línea).
  - Colores → al guardar se generan las **variantes talla × color** con SKU automático (`KA0007-SGE-M`).
    Si quitas una talla o un color, sus variantes se **desactivan** (no se borran).
  - **Coste por unidad** (sin IVA, lo que paga KAEO al proveedor) en el producto y, opcional, por variante.
  - Cada variante: SKU editable, precio y coste propios opcionales, stock, umbral de aviso y referencia en el proveedor.
  - **Fotos**: subida múltiple, texto alternativo, color asociado (la tarjeta cambia de foto al elegir ese color)
    y orden. Se convierten a WebP (1600 y 600 px) y se eliminan los datos EXIF.
  - Bajo demanda (sin límite de stock) o stock propio.
- **Inventario**: stock por variante de los productos con stock propio, filtro de stock bajo y guardado en bloque.

- **Pedidos**: listado con filtros y búsqueda; ficha con artículos, totales e IVA, historial de estados, pagos y reembolsos,
  producción y seguimiento, cliente y dirección. Acciones: cambiar estado (solo transiciones permitidas), reembolsar,
  cancelar (reembolsa si estaba cobrado y repone el stock propio), reenviar a producción, marcar como enviado a mano,
  notas internas y, con el proveedor simulado, botones que envían los webhooks de "en producción / enviado / entregado / fallo".
- **Clientes**: se crean al comprar (sin cuenta); pedidos, gasto y consentimiento de newsletter.
- **Descuentos**: porcentaje o importe, pedido mínimo, fechas de inicio y caducidad (hora de Madrid) y límite de usos.
- **Configuración**: zonas de envío (activar/desactivar, precio al cliente, coste real, envío gratis, plazo), IVA general,
  comisión de la pasarela de pago (% + fijo) y datos de la empresa.
- **Dashboard**: periodo (hoy, 7 y 30 días, este mes, mes pasado); pedidos, ingresos, ticket medio y beneficio neto;
  gráfico de ventas diarias; desglose **"¿Cuánto ganamos?"**: ingresos − IVA − coste de producto − envíos − comisiones
  − pérdidas por reembolsos = beneficio neto (antes de impuestos trimestrales/anuales). Pedidos recientes, avisos y stock bajo.
  La ficha de cada pedido muestra también su resultado.
  - Los costes se **copian en el pedido al comprar** (producto y envío) y la comisión **al cobrar**: cambiar un coste después
    no altera los pedidos ya hechos. El seed pone costes de **ejemplo** solo donde no hay ninguno.

- **Mensajes**: los del formulario de contacto, pendientes y atendidos.
- **Emails**: registro de todos los emails (a clientes y avisos internos) con vista previa tal cual llegan, motivo del
  fallo si lo hubo, botón de reenviar y un email de prueba para comprobar la configuración. La ficha de cada pedido
  lista también sus emails.

**Cookies:** la web solo usa almacenamiento técnico (carrito, sesión del admin y protección de Cloudflare), exento de
consentimiento, así que **no hay banner de cookies**. Si algún día se añade analítica o píxeles de publicidad, hay que
añadir un banner que pida permiso *antes* de cargarlos y actualizar `/legal/cookies`.

## Emails

Salen solos en cada paso del pedido: **confirmación** (al cobrar), **enviado** (con el seguimiento), **entregado**,
**reembolso** y **cancelación**; y avisos internos de **pedido nuevo**, **pedido a revisar** y **mensaje de contacto**
(a `EMAIL_ADMIN`; contestar al aviso de contacto responde directamente al cliente). Plantillas en
`src/server/emails/templates.ts`. Un fallo de envío nunca bloquea un pedido: queda como *Fallido* en Admin → Emails.

- `EMAIL_PROVIDER=log` (por defecto): no sale nada; se registran y se ven en el admin. Ideal para desarrollo y staging.
- `EMAIL_PROVIDER=smtp`: envío real. Con el buzón de IONOS:

```ini
EMAIL_PROVIDER=smtp
EMAIL_FROM="KAEO <contact@kaeo.es>"
EMAIL_ADMIN=contact@kaeo.es
SMTP_HOST=smtp.ionos.es
SMTP_PORT=587
SMTP_USER=contact@kaeo.es
SMTP_PASSWORD=<contraseña del buzón>
```

Tras cambiarlo: `docker compose up -d` y Admin → Emails → *Enviar prueba*. Para que no acaben en spam, el dominio
debe tener en Cloudflare los registros **SPF** (`v=spf1 include:_spf-eu.ionos.com ~all`) y **DKIM** que da IONOS,
y un **DMARC** (p. ej. `v=DMARC1; p=none; rua=mailto:contact@kaeo.es`).

## Pedidos y pagos

**Estados:** pendiente de pago → pagado → enviado a producción → en producción → enviado → entregado, más cancelado,
pago fallido, reembolsado y **requiere revisión** (p. ej. se cobró pero el envío a producción falló 3 veces, o no quedaba
stock al confirmar el pago). Todas las transiciones pasan por `src/server/orders.ts` y quedan en el historial.
Cada pedido guarda una copia de productos, precios, IVA y dirección del momento de la compra.

**Checkout:** los importes se calculan siempre en el servidor (`src/server/pricing.ts`): precio vigente, descuento
repartido entre líneas, envío según la zona del código postal e IVA incluido desglosado. Pulsar "Pagar" dos veces no
duplica el pedido (clave de idempotencia). El stock propio se descuenta al confirmarse el pago, de forma atómica.

**Proveedores simulados** (`PAYMENT_PROVIDER=mock`, `FULFILLMENT_PROVIDER=mock`):
- Pago: la pasarela `/mock/pago/…` tiene botones de pago correcto y fallido y envía un **webhook firmado** a
  `/api/webhooks/pago`, como haría Stripe.
- Producción: acepta los pedidos (o los rechaza con `FULFILLMENT_MOCK_FAIL=true` o si la dirección contiene
  "FALLO PRODUCCION"); los avances se simulan desde la ficha del pedido en el admin.

**Webhooks** (`/api/webhooks/pago`, `/api/webhooks/produccion`): firma HMAC-SHA256 con marca de tiempo (máx. 5 min,
comparación en tiempo constante) e **idempotencia** (cada evento se procesa una sola vez). Para probarlos a mano:
`node scripts/send-test-webhook.mjs pago '{"eventId":"evt_1","type":"payment.succeeded","providerRef":"mock_pay_…"}'`.

**Cliente:** `/pedido/<número>?t=<token>` (confirmación y seguimiento sin cuenta) y `/seguimiento` (número + email,
con límite de consultas).

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

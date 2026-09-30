# syntax=docker/dockerfile:1
# Imagen de producción de la tienda KAEO (Next.js en modo standalone).
#
# Etapas:
#   build  → además de compilar, se usa como imagen de tareas (migraciones, seed, crear
#            administrador): tiene todas las dependencias y el CLI de Prisma. Ver servicio `migrate`.
#   runner → imagen final mínima que solo ejecuta la web, con un usuario sin privilegios.

FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Las variables NEXT_PUBLIC_* se incrustan en el build.
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG NEXT_PUBLIC_SITE_ENV=production
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_SITE_ENV=$NEXT_PUBLIC_SITE_ENV \
    NEXT_OUTPUT=standalone \
    NEXT_TELEMETRY_DISABLED=1
# npm run build = prisma generate + next build
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    UPLOAD_DIR=/app/uploads
RUN addgroup -S kaeo && adduser -S kaeo -G kaeo \
  && mkdir -p /app/uploads && chown kaeo:kaeo /app/uploads
COPY --from=build /app/public ./public
COPY --from=build --chown=kaeo:kaeo /app/.next/standalone ./
COPY --from=build --chown=kaeo:kaeo /app/.next/static ./.next/static
USER kaeo
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "server.js"]

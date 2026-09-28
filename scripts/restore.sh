#!/usr/bin/env bash
# Restaura una copia hecha con scripts/backup.sh.
#
#   ./scripts/restore.sh ~/kaeo-backups/kaeo-db-AAAAMMDD-HHMMSS.sql.gz [~/kaeo-backups/kaeo-fotos-….tar.gz]
#
# ⚠️ Sustituye los datos actuales de la base de datos (y las fotos, si se indica el fichero).
set -euo pipefail

cd "$(dirname "$0")/.."
DB_FILE="${1:?Indica el fichero kaeo-db-….sql.gz}"
UPLOADS_FILE="${2:-}"
PROJECT="$(basename "$PWD")"

set -a
# shellcheck disable=SC1091
. ./.env
set +a

read -r -p "Esto SUSTITUYE los datos actuales por la copia $(basename "$DB_FILE"). ¿Seguir? (escribe SI) " ok
[ "$ok" = "SI" ] || { echo "Cancelado."; exit 1; }

docker compose stop app
gzip -dc "$DB_FILE" | docker compose exec -T db psql -q -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"
echo "Base de datos restaurada."

if [ -n "$UPLOADS_FILE" ]; then
  docker run --rm -v "${PROJECT}_uploads:/data" -v "$(cd "$(dirname "$UPLOADS_FILE")" && pwd):/backup:ro" alpine \
    sh -c "rm -rf /data/* && tar xzf /backup/$(basename "$UPLOADS_FILE") -C /data && chown -R 100:101 /data"
  echo "Fotos restauradas."
fi

docker compose up -d app
echo "Listo."

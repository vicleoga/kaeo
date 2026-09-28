#!/usr/bin/env bash
# Copia de seguridad de la tienda: base de datos (pg_dump) + fotos subidas.
#
#   ./scripts/backup.sh                 → guarda en $BACKUP_DIR (por defecto ~/kaeo-backups)
#   BACKUP_KEEP_DAYS=30 ./scripts/backup.sh
#
# Se ejecuta a diario con el temporizador systemd `kaeo-backup.timer` (ver README → Despliegue).
# Restaurar: ./scripts/restore.sh <fichero.sql.gz> [<fotos.tar.gz>]
set -euo pipefail

cd "$(dirname "$0")/.."
BACKUP_DIR="${BACKUP_DIR:-$HOME/kaeo-backups}"
KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"
STAMP="$(date +%Y%m%d-%H%M%S)"
PROJECT="$(basename "$PWD")"

# Variables de la base de datos desde .env
set -a
# shellcheck disable=SC1091
. ./.env
set +a

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

db_file="$BACKUP_DIR/kaeo-db-$STAMP.sql.gz"
docker compose exec -T db pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner | gzip -9 > "$db_file.tmp"
mv "$db_file.tmp" "$db_file"

uploads_file="$BACKUP_DIR/kaeo-fotos-$STAMP.tar.gz"
docker run --rm -v "${PROJECT}_uploads:/data:ro" -v "$BACKUP_DIR:/backup" alpine \
  tar czf "/backup/$(basename "$uploads_file").tmp" -C /data .
mv "$uploads_file.tmp" "$uploads_file"

# Comprobación mínima: el volcado no está vacío y es un gzip válido
gzip -t "$db_file"
[ "$(gzip -dc "$db_file" | head -c 100 | wc -c)" -gt 0 ]

# Rotación
find "$BACKUP_DIR" -name 'kaeo-*.gz' -mtime +"$KEEP_DAYS" -delete

echo "$(date '+%F %T') copia OK: $(basename "$db_file") ($(du -h "$db_file" | cut -f1)), $(basename "$uploads_file") ($(du -h "$uploads_file" | cut -f1))"

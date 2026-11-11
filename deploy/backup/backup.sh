#!/bin/sh
set -eu

: "${PGHOST:?PGHOST required}"
: "${PGDATABASE:?PGDATABASE required}"
: "${PGUSER:?PGUSER required}"
: "${PGPASSWORD:?PGPASSWORD required}"

BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
FILE="$BACKUP_DIR/dentistes-$STAMP.dump.gz"

mkdir -p "$BACKUP_DIR"
echo "==> pg_dump $PGDATABASE"
pg_dump -Fc -f - | gzip > "$FILE"
echo "==> backup written: $FILE ($(du -h "$FILE" | cut -f1))"

echo "==> retention: $RETENTION_DAYS days"
find "$BACKUP_DIR" -name 'dentistes-*.dump.gz' -type f -mtime "+$RETENTION_DAYS" -print -delete || true

if [ -n "${RCLONE_REMOTE:-}" ]; then
    if command -v rclone >/dev/null 2>&1; then
        echo "==> offsite copy to $RCLONE_REMOTE"
        rclone copy "$FILE" "$RCLONE_REMOTE" --config "${RCLONE_CONFIG:-/config/rclone/rclone.conf}"
    else
        echo "==> rclone not installed, skipping offsite copy"
    fi
else
    echo "==> RCLONE_REMOTE not set, skipping offsite copy"
fi

echo "==> done"

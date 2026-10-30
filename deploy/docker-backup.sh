#!/bin/sh
# Daily backup: PostgreSQL dump + stored files + secrets.
set -eu
DATA_DIR="${DATA_DIR:-$HOME/apps/backoffice-data}"
TARGET="${BACKUP_DIR:-$HOME/apps/backoffice-backups}"
KEEP_DAYS="${KEEP_DAYS:-30}"
mkdir -p "$TARGET"; chmod 700 "$TARGET"
STAMP=$(date -u +%Y%m%d-%H%M%S)
umask 077
WORK=$(mktemp -d); trap 'rm -rf "$WORK"' EXIT
if docker ps --format '{{.Names}}' | grep -qx moonshine-db; then
  docker exec moonshine-db pg_dump -U moonshine -d moonshine -Fc > "$WORK/moonshine.pgdump"
fi
cd "$DATA_DIR"
set --
for f in moonshine.sqlite3 files assets avatars secrets.json django-secret.key; do [ -e "$f" ] && set -- "$@" "$f"; done
tar czf "$TARGET/backoffice-$STAMP.tar.gz" "$@" -C "$WORK" .
find "$TARGET" -name 'backoffice-*.tar.gz' -mtime +"$KEEP_DAYS" -delete
echo "Backup gereed: $TARGET/backoffice-$STAMP.tar.gz"

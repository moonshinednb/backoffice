#!/bin/sh
# Daily backup for the docker compose deployment: consistent SQLite snapshot + files + secrets.
set -eu
DATA_DIR="${DATA_DIR:-$HOME/apps/backoffice-data}"
TARGET="${BACKUP_DIR:-$HOME/apps/backoffice-backups}"
KEEP_DAYS="${KEEP_DAYS:-30}"
mkdir -p "$TARGET"; chmod 700 "$TARGET"
STAMP=$(date -u +%Y%m%d-%H%M%S)
docker exec moonshine-backoffice python3 -c "import sqlite3;s=sqlite3.connect('/data/moonshine.sqlite3');d=sqlite3.connect('/data/.backup.sqlite3');s.backup(d);d.close();s.close()"
cd "$DATA_DIR"
set -- .backup.sqlite3
[ -d files ] && set -- "$@" files
[ -f secrets.json ] && set -- "$@" secrets.json
umask 077
tar czf "$TARGET/backoffice-$STAMP.tar.gz" "$@"
rm -f .backup.sqlite3
find "$TARGET" -name 'backoffice-*.tar.gz' -mtime +"$KEEP_DAYS" -delete
echo "Backup gereed: $TARGET/backoffice-$STAMP.tar.gz"

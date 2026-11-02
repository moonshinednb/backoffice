#!/bin/sh
# Een backup terugzetten (database; bestanden alleen als ze ontbreken):
#   sh deploy/restore.sh /home/clawd/apps/backoffice-backups/<bestand>.tar.gz --ja
# Maakt eerst zelf een backup van de huidige staat. Nooit automatisch gebruiken.
set -e
D="$(cd "$(dirname "$0")" && pwd)"
FILE="$1"
[ -n "$FILE" ] && [ "$2" = "--ja" ] || { echo "Gebruik: sh deploy/restore.sh <backupbestand> --ja"; exit 1; }
sh "$D/ssh.sh" "set -e
  test -f '$FILE' || { echo 'Backup niet gevonden: $FILE'; exit 1; }
  BACKUP_NAME=pre-restore sh ~/apps/backoffice/deploy/docker-backup.sh | tail -1
  W=\$(mktemp -d); trap 'rm -rf \"\$W\"' EXIT
  tar xzf '$FILE' -C \"\$W\" moonshine.pgdump
  docker exec -i moonshine-db pg_restore -U moonshine -d moonshine --clean --if-exists --no-owner < \"\$W/moonshine.pgdump\"
  tar xzf '$FILE' -C ~/apps/backoffice-data --skip-old-files --exclude moonshine.pgdump 2>/dev/null || true
  docker restart moonshine-backoffice moonshine-worker >/dev/null && echo 'Teruggezet: $FILE'"

#!/bin/sh
# Terug naar een eerdere versie:  sh deploy/rollback.sh v1.0 --ja
# 1. maakt een volledige backup (database + bestanden) van de huidige staat;
# 2. zet de database terug naar de migraties van die versie (met de huidige code, die de stappen terug kent);
# 3. deployt de code van die versie.
# Onderdelen die pas na die versie kwamen, verdwijnen uit de app. De backup van stap 1 bewaart ze:
# terug naar de nieuwe versie = sh deploy/deploy.sh <nieuwe versie> en daarna sh deploy/restore.sh <backup> --ja.
set -e
D="$(cd "$(dirname "$0")" && pwd)"
REF="$1"
[ -n "$REF" ] && [ "$2" = "--ja" ] || { echo "Gebruik: sh deploy/rollback.sh <versie> --ja   (versies: sh deploy/versions.sh)"; exit 1; }
. "$D/versions-lib.sh"
fetch_versions
SHA="$(resolve "$REF")"
[ -n "$SHA" ] || { echo "Onbekende versie: $REF"; exit 1; }
# Laatste migratie per app in de doelversie; apps die toen nog niet bestonden gaan naar 'zero'.
TARGETS=""
for app in $(git ls-tree -d --name-only HEAD backend/ | sed 's#backend/##'); do
  git cat-file -e "HEAD:backend/$app/migrations" 2>/dev/null || continue
  last=$(git ls-tree --name-only "$SHA" "backend/$app/migrations/" 2>/dev/null | sed -n 's#.*/\([0-9][0-9][0-9][0-9]_[^/]*\)\.py$#\1#p' | sort | tail -1)
  TARGETS="$TARGETS $app:${last:-zero}"
done
echo "Database terugzetten naar:$TARGETS"
sh "$D/ssh.sh" 'BACKUP_NAME=pre-rollback sh ~/apps/backoffice/deploy/docker-backup.sh | tail -1'
for t in $TARGETS; do
  sh "$D/ssh.sh" "docker exec moonshine-backoffice python manage.py migrate ${t%%:*} ${t#*:} --noinput 2>&1 | grep -v '^  No migrations' | tail -3"
done
sh "$D/deploy.sh" "$REF"

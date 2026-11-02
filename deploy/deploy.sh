#!/bin/sh
# Backup, code van een versie kopiëren, herbouwen en controleren. Vanuit de repo-root:
#   sh deploy/deploy.sh            # de laatste commit (HEAD)
#   sh deploy/deploy.sh v1.0       # een versie (branch versie/v1.0 op GitHub) of een commit
# De data (~/apps/backoffice-data) en .env blijven altijd staan; oude codebestanden worden opgeruimd.
set -e
D="$(cd "$(dirname "$0")" && pwd)"
. "$D/versions-lib.sh"
fetch_versions
SHA="$(resolve "${1:-HEAD}")"
[ -n "$SHA" ] || { echo "Onbekende versie: $1 (zie: sh deploy/versions.sh)"; exit 1; }
VERSION="$(label "${1:-HEAD}")"
COMMIT="$(git rev-parse --short "$SHA")"
echo "Deploy $VERSION ($COMMIT)"
BACKUP="$(sh "$D/ssh.sh" 'BACKUP_NAME=pre-deploy sh ~/apps/backoffice/deploy/docker-backup.sh | tail -1' | sed 's/^Backup gereed: //')"
echo "Backup: $BACKUP"
# Schone code: alles in backend/ en frontend/ weg behalve node_modules, dan de versie uitpakken.
git archive "$SHA" | sh "$D/ssh.sh" "set -e; cd ~/apps/backoffice
  find backend -mindepth 1 -delete 2>/dev/null || true
  find frontend -mindepth 1 -maxdepth 1 ! -name node_modules -exec rm -rf {} + 2>/dev/null || true
  tar x
  printf '%s\n' '$VERSION' > backend/VERSION
  docker compose up -d --build 2>&1 | tail -1
  printf '%s %s %s %s\n' \"\$(date -u +%Y-%m-%dT%H:%M:%SZ)\" '$VERSION' '$COMMIT' '$BACKUP' >> ~/apps/backoffice-deploys.log"
sleep 8
sh "$D/ssh.sh" 'curl -s -o /dev/null -w "%{http_code}\n" http://100.111.153.38:8096/; docker logs moonshine-backoffice 2>&1 | grep Applying | tail -2; cd ~/apps/backoffice && docker compose ps --format "{{.Name}} {{.Status}}"'

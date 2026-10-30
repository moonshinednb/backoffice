#!/bin/sh
# Backup, code kopiëren, herbouwen en controleren. Vanuit de repo-root:  sh deploy/deploy.sh
set -e
D="$(cd "$(dirname "$0")" && pwd)"
sh "$D/ssh.sh" 'sh ~/apps/backoffice/deploy/docker-backup.sh | tail -1'
git archive HEAD | sh "$D/ssh.sh" 'tar x -C ~/apps/backoffice && cd ~/apps/backoffice && docker compose up -d --build 2>&1 | tail -1'
sleep 8
sh "$D/ssh.sh" 'curl -s -o /dev/null -w "%{http_code}\n" http://100.111.153.38:8096/; docker logs moonshine-backoffice 2>&1 | grep Applying | tail -2; cd ~/apps/backoffice && docker compose ps --format "{{.Name}} {{.Status}}"'

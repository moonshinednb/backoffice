#!/usr/bin/env bash
set -euo pipefail
if [ "$(id -u)" -ne 0 ]; then echo 'Run this installer as root.'; exit 1; fi
cd /opt/moonshine-backoffice
command -v python3 >/dev/null
command -v tailscale >/dev/null
if ! id moonshine >/dev/null 2>&1; then useradd --system --home-dir /var/lib/moonshine --shell /usr/sbin/nologin moonshine; fi
install -d -o moonshine -g moonshine -m 700 /var/lib/moonshine
install -d -m 700 /var/backups/moonshine
if [ ! -f .env ]; then
  printf '%s\n' 'MOONSHINE_HOST=127.0.0.1' 'MOONSHINE_PORT=8765' 'MOONSHINE_DATA=/var/lib/moonshine' 'MOONSHINE_SECURE_COOKIE=1' 'MOONSHINE_WORKER=1' > .env
fi
chown root:moonshine .env
chmod 640 .env
install -m 644 deploy/moonshine-backoffice.service /etc/systemd/system/moonshine-backoffice.service
install -m 644 deploy/moonshine-backup.service /etc/systemd/system/moonshine-backup.service
install -m 644 deploy/moonshine-backup.timer /etc/systemd/system/moonshine-backup.timer
systemctl daemon-reload
echo 'Install complete. Initialize the administrator before starting the service.'
echo 'MOONSHINE_DATA=/var/lib/moonshine python3 server.py init-admin --username peppy'
echo 'chown -R moonshine:moonshine /var/lib/moonshine'
echo 'systemctl enable --now moonshine-backoffice moonshine-backup.timer'
echo 'tailscale serve --bg --https=443 http://127.0.0.1:8765'

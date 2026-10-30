#!/bin/sh
# ssh naar de server met automatisch herstel van de verbinding.  Gebruik: sh deploy/ssh.sh '<commando>'
D="$(dirname "$0")"
sh "$D/connect.sh" >/dev/null 2>&1 || sh "$D/connect.sh" || exit 1
exec ssh -o BatchMode=yes -o ServerAliveInterval=15 -o ServerAliveCountMax=4 -o StrictHostKeyChecking=accept-new \
  -o ProxyCommand="nc -X 5 -x localhost:1055 %h %p" clawd@100.111.153.38 "$@"

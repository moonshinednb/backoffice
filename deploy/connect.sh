#!/bin/sh
# Zorgt dat de Tailscale-verbinding met de server er is, en herstelt hem als hij weg is.
# Veilig om vaak aan te roepen; doet niets als alles al werkt.
#   sh deploy/connect.sh          verbinding controleren/herstellen
#   sh deploy/connect.sh watch    daarnaast een bewaker starten die elke 30 s controleert
SELF="$(cd "$(dirname "$0")" && pwd)/$(basename "$0")"
TS="$HOME/ts"
SOCK="$TS/sock"
mkdir -p "$TS"; cd "$TS"

if [ ! -x ./tailscaled ]; then
  curl -sSL https://pkgs.tailscale.com/stable/tailscale_1.90.6_amd64.tgz | tar xz --strip-components=1
fi
command -v ssh >/dev/null 2>&1 || apt-get install -y -qq openssh-client netcat-openbsd >/dev/null 2>&1

up() { ./tailscale --socket="$SOCK" status >/dev/null 2>&1; }

if ! up; then
  # setsid: een eigen sessie, zodat tailscaled niet meesterft als een commando wordt afgebroken
  setsid nohup ./tailscaled --tun=userspace-networking --socks5-server=localhost:1055 \
    --state="$TS/state" --socket="$SOCK" >"$TS/ts.log" 2>&1 < /dev/null &
  i=0; while [ $i -lt 20 ] && ! up; do sleep 1; i=$((i+1)); done
fi

# Alleen inloggen als dat nodig is (de status blijft in ~/ts/state bewaard)
if ./tailscale --socket="$SOCK" status 2>&1 | grep -qiE "Logged out|NeedsLogin"; then
  ./tailscale --socket="$SOCK" up --authkey="${TS_AUTHKEY:?TS_AUTHKEY ontbreekt of is ongeldig}" --hostname=claude-deploy
fi

# Wachten tot de server echt bereikbaar is
i=0
while [ $i -lt 30 ]; do
  if ssh -o BatchMode=yes -o ConnectTimeout=5 -o StrictHostKeyChecking=accept-new \
       -o ProxyCommand="nc -X 5 -x localhost:1055 %h %p" clawd@100.111.153.38 true 2>/dev/null; then
    echo "verbonden"; break
  fi
  sleep 2; i=$((i+1))
done
[ $i -lt 30 ] || { echo "geen verbinding met de server" >&2; exit 1; }

PIDFILE="$TS/watch.pid"
if [ "$1" = "watch" ] && ! { [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; }; then
  setsid nohup sh "$SELF" loop >/dev/null 2>&1 < /dev/null &
fi
if [ "$1" = "loop" ]; then
  echo $$ > "$PIDFILE"
  while true; do sleep 30; sh "$SELF" >/dev/null 2>&1; done
fi

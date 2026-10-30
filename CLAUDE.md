# Moonshine Backoffice: werkafspraken voor Claude

Rapporteer kort en in het Nederlands. Raak `/opt/mo` niet aan en gebruik geen sudo op de server.

## Productie
- Server: `clawd@100.111.153.38` (Tailscale-host `clawd-gk5npfo`).
- Code: `~/apps/backoffice`. Docker compose: `moonshine-backoffice` (web), `moonshine-worker`, `moonshine-db` (Postgres, volume `pgdata`).
- URL: http://100.111.153.38:8096/ (alleen via het tailnet; `BIND_ADDR` staat in `~/apps/backoffice/.env`).
- Data: `~/apps/backoffice-data`. Nooit overschrijven of verwijderen.
- Admin `peppy`: het wachtwoord staat in `~/apps/backoffice-admin.txt` (chmod 600). Nooit printen.
- Backup: dagelijks om 03:17 via crontab met `deploy/docker-backup.sh`, naar `~/apps/backoffice-backups` (30 dagen bewaard). Log: `~/apps/backoffice-backup.log`.

## Verbinden vanuit een cloud-sessie
Tailscale en ssh moeten in elke nieuwe container opnieuw worden opgezet:
```sh
apt-get install -y -qq openssh-client
mkdir -p ~/ts && cd ~/ts && curl -sSL https://pkgs.tailscale.com/stable/tailscale_1.90.6_amd64.tgz | tar xz --strip-components=1
nohup ./tailscaled --tun=userspace-networking --socks5-server=localhost:1055 --state=$HOME/ts/state --socket=$HOME/ts/sock >ts.log 2>&1 &
sleep 3; ./tailscale --socket=$HOME/ts/sock up --authkey=$TS_AUTHKEY --hostname=claude-deploy
```
Daarna ssh via de SOCKS-proxy:
```sh
ssh -o StrictHostKeyChecking=accept-new -o ProxyCommand="nc -X 5 -x localhost:1055 %h %p" clawd@100.111.153.38
```

## Code
Lees eerst `ARCHITECTURE.md` (projectkaart: modules, modellen, endpoints, routes, afspraken) in plaats van de hele code. Werk die kaart bij als de structuur verandert.

## Werkwijze bij wijzigingen
1. Wijzig de code hier en test: `cd backend && python manage.py test` en `cd frontend && npm run build`.
   Stack: Django 5.2 + Django Ninja (`backend/`), React + Vite + TS (`frontend/`), PostgreSQL en een aparte worker (`manage.py run_worker`) in docker compose.
2. Commit en push naar de sessie-branch.
3. Deploy: maak eerst een backup, kopieer dan de code en herbouw. `.env` en de data blijven staan:
```sh
SSH="ssh -o ProxyCommand='nc -X 5 -x localhost:1055 %h %p' clawd@100.111.153.38"
eval $SSH '~/apps/backoffice/deploy/docker-backup.sh'
git archive HEAD | eval $SSH "'tar x -C ~/apps/backoffice && cd ~/apps/backoffice && docker compose up -d --build'"
```
4. Controleer of `curl http://100.111.153.38:8096/` een 200 geeft (vanaf de server).

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.

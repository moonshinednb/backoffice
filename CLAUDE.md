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
Gebruik de scripts in `deploy/`; die zetten Tailscale op (als dat nodig is) en herstellen de verbinding zelf als hij wegvalt:
```sh
sh deploy/connect.sh watch     # eenmalig per sessie: verbinden + bewaker die elke 30 s controleert
sh deploy/ssh.sh '<commando>'  # ssh naar de server, herstelt zo nodig eerst de verbinding
sh deploy/deploy.sh            # backup, code kopiëren, herbouwen, controleren (200 + containers)
```
`TS_AUTHKEY` moet een **herbruikbare** sleutel zijn (een eenmalige is na één sessie ongeldig). Na de eerste keer inloggen blijft de status in `~/ts/state` bewaard.

## Versies en terugrollen
- Elke versie staat op GitHub als branch `versie/vX.Y` (tags laat de git-proxy niet toe). Een versie-branch wordt nooit meer gewijzigd; maak hem na een afgeronde fase met de GitHub-koppeling (create_branch vanaf de sessie-branch).
- `sh deploy/versions.sh`: versies en de laatste deploys (met de backup die vlak ervoor is gemaakt).
- `sh deploy/deploy.sh [vX.Y|commit]`: deployt HEAD of een versie; ruimt oude codebestanden op en zet de versie linksonder in de app.
- `sh deploy/rollback.sh vX.Y --ja`: backup, database terug naar de migraties van die versie, code van die versie. Nieuwere onderdelen verdwijnen uit de app maar staan in de backup.
- `sh deploy/restore.sh <backup> --ja`: zet een backup terug (maakt eerst zelf een backup). Alleen op verzoek.

## Code
Lees eerst `ARCHITECTURE.md` (projectkaart: modules, modellen, endpoints, routes, afspraken) in plaats van de hele code. Werk die kaart bij als de structuur verandert.

## Werkwijze bij wijzigingen
1. Wijzig de code hier en test: `cd backend && python manage.py test` en `cd frontend && npm run build`.
   Stack: Django 5.2 + Django Ninja (`backend/`), React + Vite + TS (`frontend/`), PostgreSQL en een aparte worker (`manage.py run_worker`) in docker compose.
2. Commit en push naar de sessie-branch.
3. Deploy: `sh deploy/deploy.sh` (maakt eerst een backup; `.env` en de data blijven staan).
4. Controleer of `curl http://100.111.153.38:8096/` een 200 geeft (vanaf de server).

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.

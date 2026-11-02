#!/bin/sh
# Overzicht: versies (tags) in git en de laatste deploys op de server.
D="$(cd "$(dirname "$0")" && pwd)"
. "$D/versions-lib.sh"
fetch_versions
echo "== Versies (branches versie/* op GitHub)"
git for-each-ref --sort=-committerdate --format='%(refname:lstrip=4)  %(committerdate:short)  %(objectname:short)  %(subject)' refs/remotes/origin/versie/ | head -20
echo "== Laatste deploys (tijd, versie, commit, backup ervoor)"
sh "$D/ssh.sh" 'tail -10 ~/apps/backoffice-deploys.log 2>/dev/null || echo "(nog geen log)"'

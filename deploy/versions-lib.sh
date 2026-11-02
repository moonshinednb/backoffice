# Gedeeld door deploy.sh, rollback.sh en versions.sh.
# Versies staan op GitHub als branches versie/<naam> (bijv. versie/v1.0) en worden nooit meer gewijzigd.
fetch_versions() {
  git fetch -q origin 'refs/heads/versie/*:refs/remotes/origin/versie/*' 2>/dev/null || true
}
# resolve <versie|commit>  ->  commit-sha (leeg als onbekend)
resolve() {
  git rev-parse --verify -q "origin/versie/$1^{commit}" 2>/dev/null || git rev-parse --verify -q "$1^{commit}" 2>/dev/null || true
}
# label <versie|commit>  ->  'v1.1' voor een versie, anders 'v1.1+abc1234' (laatste versie waar de commit op voortbouwt)
label() {
  if git rev-parse --verify -q "origin/versie/$1^{commit}" >/dev/null 2>&1; then echo "$1"; return; fi
  sha=$(resolve "$1"); base=""
  for v in $(git for-each-ref --format='%(refname:lstrip=4)' refs/remotes/origin/versie/ | sort -V); do
    git merge-base --is-ancestor "origin/versie/$v" "$sha" 2>/dev/null && base="$v"
  done
  short=$(git rev-parse --short "$sha")
  if [ -n "$base" ] && [ "$(git rev-parse "origin/versie/$base")" = "$sha" ]; then echo "$base"; else echo "${base:-dev}+$short"; fi
}

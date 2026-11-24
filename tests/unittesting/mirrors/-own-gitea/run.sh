#!/usr/bin/env bash
# A Gitea of our own as a mirror (phase 46), in a container on this machine: its repository made
# (devlog.py --ensure), every branch and tag pushed to it (mirrors.sh), the devlog written on it -
# milestones, labels, an issue per phase, Q<n> and PP<n> - as on GitHub (devlog.py), and written
# again changing nothing. Run in a clone, so no ref of the pushing lands in this repository.
# Needs Docker, git, jq, python3. Everything it starts it removes.
# Usage: task unittesting:mirrors-gitea
set -euo pipefail
cd "$(dirname "$0")/../../../.."
work=$(mktemp -d)
name=pjr-gitea-test
port=3399
cleanup() {
  docker rm -f "$name" > /dev/null 2>&1 || true
  rm -rf "$work"
}
trap cleanup EXIT

docker run -d --name "$name" -p "127.0.0.1:$port:3000" \
  -e GITEA__security__INSTALL_LOCK=true -e GITEA__database__DB_TYPE=sqlite3 \
  -e GITEA__server__ROOT_URL="http://127.0.0.1:$port/" gitea/gitea:1.27.3 > /dev/null
url="http://127.0.0.1:$port"
for _ in $(seq 1 60); do curl -sf "$url/api/v1/version" > /dev/null && break; sleep 1; done
docker exec -u git "$name" gitea admin user create --username Sarverott \
  --password "$(head -c 18 /dev/urandom | base64)" --email sarverott@example.invalid \
  --admin --must-change-password=false > /dev/null
token=$(docker exec -u git "$name" gitea admin user generate-access-token \
  --username Sarverott --token-name mirror --scopes all --raw)

git clone --quiet --no-local . "$work/repo"
# the scripts as they are now, over the clone; what is pushed is still the committed branches
rsync -a --exclude .git --exclude node_modules --exclude resources --exclude dist --exclude site ./ "$work/repo/"
cd "$work/repo"
export MIRROR_OWN_GITEA_URL="$url" MIRROR_OWN_GITEA_TOKEN="$token" MIRRORS_ONLY=own-gitea
python3 scripts/devops/mirrors/devlog.py --ensure
scripts/devops/mirrors/mirrors.sh "$work/badges"
python3 scripts/devops/mirrors/devlog.py > "$work/first.log"
python3 scripts/devops/mirrors/devlog.py > "$work/second.log"

api() { curl -sf -H "authorization: token $token" "$url/api/v1/repos/Sarverott/P-jol-roll$1"; }
branches=$(api "/branches?limit=50" | jq -r '.[].name' | sort | tr '\n' ' ')
milestones=$(api "/milestones?state=all&limit=50" | jq length)
issues=0
for page in 1 2 3 4; do
  issues=$((issues + $(api "/issues?state=all&type=issues&labels=devlog&limit=50&page=$page" | jq length)))
done
wanted=$(python3 -c "
import importlib.util
spec = importlib.util.spec_from_file_location('d', 'scripts/devops/github/devlog.py'); d = importlib.util.module_from_spec(spec); spec.loader.exec_module(d)
plan, done, issues = d.wanted(); print(len(plan), len(issues))")
read -r want_milestones want_issues <<< "$wanted"
echo "branches: $branches"
echo "milestones $milestones of $want_milestones, issues $issues of $want_issues"
[[ " $branches " == *" development "* && " $branches " == *" master "* ]] || { echo "the branches did not come" >&2; exit 1; }
[ "$milestones" = "$want_milestones" ] && [ "$issues" = "$want_issues" ] || { echo "the devlog is not whole" >&2; exit 1; }
grep -q '"message": *"200 OK"' "$work/badges/mirror-own-gitea.json" || { cat "$work/badges"/* >&2; exit 1; }
if grep -qE "opened|brought up to date|closed|open$" "$work/second.log"; then
  echo "the second run changed something:" >&2
  cat "$work/second.log" >&2
  exit 1
fi
echo "our own Gitea: the code, the devlog, written twice the same"

#!/usr/bin/env bash
# Closing a phase of docs/devlog/TODO.md: Y of vX.Y.Z bumped on development, committed,
# pushed, and the pull request development → master opened (pull-request.sh). Refuses when
# the phase still has an open step. Outputs version=<the new version>.
# Usage: phase-close.sh <phase number>   (needs GH_TOKEN)
# shellcheck source=../_common.sh
source "$(dirname "$0")/../_common.sh"
phase="${1:?phase number}"

git fetch -q origin development
git checkout -q -B development origin/development
open=$(awk -v p="## Phase $phase:" '
  index($0, p) == 1 { inside = 1; next }
  /^## / { inside = 0 }
  inside && /^- \[ \]/ { n++ }
  END { print n + 0 }' docs/devlog/TODO.md)
if ! grep -q "^## Phase $phase:" docs/devlog/TODO.md; then
  echo "no phase $phase in docs/devlog/TODO.md" >&2
  exit 1
fi
if [ "$open" != 0 ]; then
  echo "phase $phase has $open open step(s); it is not closed" >&2
  exit 1
fi

from=$(version)
node src/devtools/version.ts bump minor
bot_identity
git commit -qam "chore(release): v$from → v$(version) (phase $phase closed)"
git push -q origin development
output version "$(version)"
"$(dirname "$0")/pull-request.sh" development master "phase $phase closed"

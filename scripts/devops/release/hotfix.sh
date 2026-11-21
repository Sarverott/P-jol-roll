#!/usr/bin/env bash
# On master: when the version there is released already (its tag exists), the patch is
# bumped, committed and pushed to master - a hotfix that reached master after a release.
# Outputs version=<the version to release>.
# Usage: hotfix.sh
# shellcheck source=../_common.sh
source "$(dirname "$0")/../_common.sh"
git fetch -q --tags origin
if git rev-parse -q --verify "refs/tags/v$(version)" > /dev/null; then
  from=$(version)
  node src/devtools/version.ts bump patch
  bot_identity
  git commit -qam "chore(release): v$from → v$(version) (a hotfix on master)"
  git push -q origin HEAD:master
  echo "v$from was released already: master is now v$(version)"
fi
output version "$(version)"

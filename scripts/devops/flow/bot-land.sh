#!/usr/bin/env bash
# dev/dependabot, checked, lands in development with a merge commit; then dev/dependabot is
# brought up to development, so Dependabot's next pull requests start from it. Nothing
# happens when dev/dependabot has nothing development lacks.
# Usage: dependabot-land.sh
# shellcheck source=../_common.sh
source "$(dirname "$0")/../_common.sh"
git fetch -q origin development dev/dependabot
if [ "$(git rev-list --count origin/development..origin/dev/dependabot)" = 0 ]; then
  echo "dev/dependabot has nothing development lacks"
else
  "$(dirname "$0")/merge-into.sh" origin/dev/dependabot development
fi
# a fast-forward: dev/dependabot is inside development now
git push -q origin "refs/remotes/origin/development:refs/heads/dev/dependabot"
echo "dev/dependabot is at development"

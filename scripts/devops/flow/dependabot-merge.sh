#!/usr/bin/env bash
# A pull request of Dependabot into dev/dependabot, merged at once with no checks of its own:
# dev/dependabot is checked as a whole before it lands in development (dependabot-land.sh).
# Anything not from Dependabot, or not into dev/dependabot, is left alone.
# Usage: dependabot-merge.sh <pull request number>   (needs GH_TOKEN)
# shellcheck source=../_common.sh
source "$(dirname "$0")/../_common.sh"
pr="${1:?pull request number}"
read -r author base < <(gh pr view "$pr" --json author,baseRefName --jq '.author.login + " " + .baseRefName')
if [ "$base" != dev/dependabot ] || [ "${author#app/}" != dependabot ]; then
  echo "#$pr: by $author into $base - left to a person"
  exit 0
fi
gh pr merge "$pr" --merge --subject "chore(merge): Dependabot's #$pr into dev/dependabot"
echo "#$pr merged into dev/dependabot"

#!/usr/bin/env bash
# A pull request of Dependabot into dev/dependabot, merged at once with no checks of its own:
# dev/dependabot is checked as a whole before it lands in development (dependabot-land.sh).
# A security update of Dependabot opens against master whatever dependabot.yml says; it is
# turned to dev/dependabot here, then merged the same way. Anything not from Dependabot, or
# into another branch, is left alone; so is a pull request that is no longer open.
# Usage: dependabot-merge.sh <pull request number>   (needs GH_TOKEN)
# shellcheck source=../_common.sh
source "$(dirname "$0")/../_common.sh"
pr="${1:?pull request number}"
read -r author base state < <(gh pr view "$pr" --json author,baseRefName,state \
  --jq '.author.login + " " + .baseRefName + " " + .state')
if [ "${author#app/}" != dependabot ] || [ "$state" != OPEN ]; then
  echo "#$pr: by $author, $state - left alone"
  exit 0
fi
case "$base" in
  dev/dependabot) ;;
  master)
    gh pr edit "$pr" --base dev/dependabot
    echo "#$pr: turned from master to dev/dependabot" ;;
  *)
    echo "#$pr: into $base - left to a person"
    exit 0 ;;
esac
gh pr merge "$pr" --merge --subject "chore(merge): Dependabot's #$pr into dev/dependabot"
echo "#$pr merged into dev/dependabot"

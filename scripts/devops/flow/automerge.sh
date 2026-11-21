#!/usr/bin/env bash
# A pull request from a contributor's dev/<name> into development is merged (a merge
# commit, as `git merge --no-ff` makes) once its checks passed. Any other pull request is
# left to a person.
# Usage: automerge.sh <pull request number>   (needs GH_TOKEN)
# shellcheck source=../_common.sh
source "$(dirname "$0")/../_common.sh"
pr="${1:?pull request number}"
read -r head base < <(gh pr view "$pr" --json headRefName,baseRefName --jq '.headRefName + " " + .baseRefName')
case "$head" in
  dev/*) ;;
  *) echo "#$pr: $head is not a contributor's branch; left to a person"; exit 0 ;;
esac
if [ "$base" != development ]; then
  echo "#$pr goes into $base, not development; left to a person"
  exit 0
fi
gh pr merge "$pr" --merge --subject "chore(merge): $head into development (#$pr)"
echo "#$pr: $head merged into development"

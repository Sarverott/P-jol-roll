#!/usr/bin/env bash
# A pull request of a bot, merged into the bot's own contributor branch, then that branch's
# checks dispatched (checks.yml checks its own commit; bots-land.yml lands it when green):
#   Dependabot -> dev/dependabot, merged at once (an update is whole when it is opened)
#   Jarvis (GitHub Copilot: author Copilot, branches copilot/* or dev/Copilot*) -> dev/Jarvis,
#     merged when it is no longer a draft (Copilot's agent works in a draft and marks it ready)
# A pull request opened against master or development is turned to the bot's branch first.
# Anything else, or a pull request no longer open, is left alone.
# Usage: bot-merge.sh <pull request number>   (needs GH_TOKEN)
# shellcheck source=../_common.sh
source "$(dirname "$0")/../_common.sh"
pr="${1:?pull request number}"
read -r author head base state draft < <(gh pr view "$pr" \
  --json author,headRefName,baseRefName,state,isDraft \
  --jq '[.author.login, .headRefName, .baseRefName, .state, .isDraft] | join(" ")')
author="${author#app/}"
if [ "$author" = dependabot ]; then
  branch=dev/dependabot
elif [ "$author" = Copilot ] || [[ "$head" == copilot/* || "$head" == dev/Copilot* ]]; then
  branch=dev/Jarvis
else
  echo "#$pr: by $author from $head - not a bot's, left alone"
  exit 0
fi
if [ "$state" != OPEN ]; then
  echo "#$pr: $state - left alone"
  exit 0
fi
case "$base" in
  "$branch") ;;
  master | development)
    # gh pr edit --base said yes and changed nothing once (#19-#22); the api does it
    gh api -X PATCH "repos/{owner}/{repo}/pulls/$pr" -f base="$branch" --silent
    echo "#$pr: turned from $base to $branch" ;;
  *)
    echo "#$pr: into $base - left to a person"
    exit 0 ;;
esac
if [ "$branch" = dev/Jarvis ] && [ "$draft" = true ]; then
  echo "#$pr: a draft of Jarvis - merged when it is marked ready"
  exit 0
fi
# several pull requests of a bot opened at once race for the branch: "Base branch was
# modified" is waited out and tried again; one that conflicts after another's merge (go.sum,
# package-lock.json) is asked to rebase - Dependabot's own command - and merged on its next run
for attempt in 1 2 3 4 5; do
  mergeable=$(gh pr view "$pr" --json mergeable --jq .mergeable)
  if [ "$mergeable" = CONFLICTING ]; then
    if [ "$author" = dependabot ]; then
      gh pr comment "$pr" --body "@dependabot rebase"
      echo "#$pr: conflicts with $branch - Dependabot asked to rebase"
    else
      echo "#$pr: conflicts with $branch - left to Jarvis or a person"
    fi
    exit 0
  fi
  if gh pr merge "$pr" --merge --subject "chore(merge): #$pr of $author into $branch"; then
    echo "#$pr merged into $branch"
    break
  fi
  [ "$attempt" = 5 ] && { echo "#$pr: not merged after 5 tries" >&2; exit 1; }
  sleep $((attempt * 15))
done
# one check of the branch for a pile of merges: a newer dispatch finds the older still queued
gh workflow run checks.yml --ref "$branch"
echo "checks of $branch dispatched"

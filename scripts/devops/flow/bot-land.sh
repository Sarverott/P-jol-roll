#!/usr/bin/env bash
# The commit of a bot's branch that checks.yml found green lands in development with a merge
# commit; then the branch is brought up to development, so the bot's next pull requests start
# from it. Only that commit lands: what was merged into the branch after it waits for its own
# check. Nothing happens when development has it already.
# Usage: bot-land.sh <branch: dev/dependabot | dev/Jarvis> <checked commit>
# shellcheck source=../_common.sh
source "$(dirname "$0")/../_common.sh"
branch="${1:?branch}"
sha="${2:?checked commit}"
case "$branch" in
  dev/dependabot | dev/Jarvis) ;;
  *) echo "$branch is not a bot's branch" >&2; exit 1 ;;
esac
git fetch -q origin development "$branch"
if git merge-base --is-ancestor "$sha" origin/development; then
  echo "development has $sha already"
else
  "$(dirname "$0")/merge-into.sh" "$sha" development
fi
git fetch -q origin development
# a fast-forward when nothing newer came into the branch; else it keeps its newer merges
if git merge-base --is-ancestor "origin/$branch" origin/development; then
  git push -q origin "refs/remotes/origin/development:refs/heads/$branch"
  echo "$branch is at development"
else
  echo "$branch holds merges newer than $sha - they land after their own check"
fi

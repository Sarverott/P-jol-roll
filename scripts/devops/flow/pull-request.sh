#!/usr/bin/env bash
# Opens the pull request <head> → <base> unless <head> has nothing <base> lacks; one open
# already is brought up to the version it now releases. Outputs url=<pull request>.
# Usage: pull-request.sh <head, e.g. development> <base, e.g. master> [<why, e.g. "phase 4 closed">]
#   (needs GH_TOKEN)
# shellcheck source=../_common.sh
source "$(dirname "$0")/../_common.sh"
head="${1:?head branch}"
base="${2:?base branch}"
why="${3:-}"

git fetch -q origin "$head" "$base"
if [ "$(git rev-list --count "origin/$base..origin/$head")" = 0 ]; then
  echo "$head has nothing $base lacks"
  exit 0
fi
version=$(git show "origin/$head:package.json" | jq -r .version)
title="v$version: $head → $base${why:+ ($why)}"
body=$(
  echo "Merging it releases v$version (the release workflow of master)."
  if [ -n "$why" ]; then echo; echo "Why now: $why."; fi
  # who stands behind it, for the gate (authors.sh): the run of the workflow that opened it
  if [ -n "${GITHUB_RUN_ID:-}" ]; then echo; echo "Opened by the run $GITHUB_RUN_ID of $GITHUB_WORKFLOW."; fi
  echo
  echo "## Commits"
  echo
  git log --no-merges --format='- %s (%h)' "origin/$base..origin/$head"
)
open=$(gh pr list --head "$head" --base "$base" --state open --json url --jq '.[0].url // empty')
if [ -n "$open" ]; then
  gh pr edit "$open" --title "$title" --body "$body" > /dev/null
  echo "open already, now $title: $open"
  output url "$open"
  exit 0
fi
url=$(gh pr create --head "$head" --base "$base" --title "$title" --body "$body")
echo "opened: $url"
output url "$url"

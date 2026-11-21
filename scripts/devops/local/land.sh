#!/usr/bin/env bash
# Lands the contributor's branch the BOS way: dev/<name> merged into development with
# --no-ff, both pushed to origin, and dev/<name> brought up to development again.
# Run on your dev/<name> with a clean working tree.
# Usage: land.sh "<what the batch did>"   (task flow:land -- "...")
# shellcheck source=../_common.sh
source "$(dirname "$0")/../_common.sh"
summary="${1:?what the batch did, for the merge message}"
branch=$(git rev-parse --abbrev-ref HEAD)
case "$branch" in
  dev/*) ;;
  *) echo "on $branch; land runs on a contributor's dev/<name>" >&2; exit 1 ;;
esac
if [ -n "$(git status --porcelain)" ]; then
  echo "the working tree has changes; commit them first" >&2
  exit 1
fi

merge_driver
git fetch -q origin
git checkout -q development
git merge -q --ff-only origin/development
git merge --no-ff -m "chore(merge): $branch - $summary" "$branch"
git push -q origin development "$branch"
git checkout -q "$branch"
git merge -q --ff-only development
echo "$branch landed in development, both pushed; $branch is at development again"

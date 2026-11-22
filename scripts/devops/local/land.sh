#!/usr/bin/env bash
# Lands the contributor's branch the BOS way: dev/<name> merged into development with
# --no-ff, both pushed to origin, and dev/<name> brought up to development again.
# Run on your dev/<name> with a clean working tree. Every check runs first (task check: Biome,
# the build, the tests) on exactly what is landed, so nothing checked before its last change
# reaches development (almanac: checked-before-last-change).
# Usage: land.sh "<what the batch did>"   (task flow:land -- "...")
# shellcheck source=../_common.sh
source "$(dirname "$0")/../_common.sh"
summary="${*:?what the batch did, for the merge message}"
branch=$(git rev-parse --abbrev-ref HEAD)
case "$branch" in
  dev/*) ;;
  *) echo "on $branch; land runs on a contributor's dev/<name>" >&2; exit 1 ;;
esac
# commitlint takes a header of 100 characters at most; said before the checks, not after them
header="chore(merge): $branch - $summary"
if [ "${#header}" -gt 100 ]; then
  echo "the merge's message would be ${#header} characters, commitlint takes 100: a shorter summary" >&2
  exit 1
fi
if [ -n "$(git status --porcelain)" ]; then
  echo "the working tree has changes; commit them first" >&2
  exit 1
fi

# the checks of CI, here and now, on the commit that lands; its tree remembered, so the
# pre-push hook does not check the same tree again
scripts/devops/local/verify-push.sh --now || { echo "task check failed - nothing landed" >&2; exit 1; }

merge_driver
git fetch -q origin
git checkout -q development
git merge -q --ff-only origin/development
git merge --no-ff -m "$header" "$branch"
git push -q origin development "$branch"
git checkout -q "$branch"
git merge -q --ff-only development
echo "$branch landed in development, both pushed; $branch is at development again"

#!/usr/bin/env bash
# Takes what came from elsewhere: development brought up to origin (the owner's edits made
# on GitHub land there), master merged into it when a merge into master left master ahead
# (then pushed), and the current dev/<name> brought up to development.
# Usage: sync.sh   (task flow:sync)
# shellcheck source=../_common.sh
source "$(dirname "$0")/../_common.sh"
branch=$(git rev-parse --abbrev-ref HEAD)
if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  echo "the working tree has changes; commit or stash them first" >&2
  exit 1
fi

merge_driver
git fetch -q origin
git checkout -q development
git merge -q --ff-only origin/development
if [ "$(git rev-list --count development..origin/master)" != 0 ]; then
  git merge --no-ff -m "chore(merge): master into development" origin/master
  git push -q origin development
  echo "master merged into development and pushed"
fi
git checkout -q "$branch"
case "$branch" in
  dev/*) git merge -q --ff-only development && echo "$branch is at development" ;;
  *) echo "on $branch: up to date with origin" ;;
esac

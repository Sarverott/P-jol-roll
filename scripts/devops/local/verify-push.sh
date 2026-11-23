#!/usr/bin/env bash
# Every check (task check: Biome, the build, the tests) before a push, on this machine.
# A tree checked once is remembered (.git/p-jol-roll-checked), so `task flow:land`, which
# checks before it merges, pushes both branches without checking the same tree again.
# Workflows skip it (CI is set): they run the checks job of their own.
# Usage: verify-push.sh          the pre-push hook (task husky:pre-push): git's lines on stdin
#        verify-push.sh --now    check HEAD here and now, remember its tree (land.sh)
# shellcheck source=../_common.sh
source "$(dirname "$0")/../_common.sh"
stamp=$(git rev-parse --git-path p-jol-roll-checked)
zero=0000000000000000000000000000000000000000

checked() { [ -f "$stamp" ] && grep -qx "$1" "$stamp"; }

# task check on the working tree; its tree remembered when nothing is left uncommitted
check_here() {
  local task_bin=node_modules/.bin/task
  [ -x "$task_bin" ] || task_bin=task
  if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
    echo "verify: the working tree has uncommitted edits - they are checked too, and the tree is not remembered" >&2
    "$task_bin" check
    return
  fi
  # set -e does not hold inside a function called by ||, so a failed check returns by hand
  "$task_bin" check || return
  git rev-parse 'HEAD^{tree}' >>"$stamp"
  tail -n 50 "$stamp" >"$stamp.tmp" && mv "$stamp.tmp" "$stamp"
}

if [ "${1:-}" = "--now" ]; then
  check_here
  exit
fi

if [ -n "${CI:-}" ]; then exit 0; fi

head_tree=$(git rev-parse 'HEAD^{tree}')
while read -r _ local_sha remote_ref _; do
  [ "$local_sha" = "$zero" ] && continue # a deletion
  tree=$(git rev-parse "$local_sha^{tree}")
  checked "$tree" && continue
  if [ "$tree" != "$head_tree" ]; then
    echo "verify: $remote_ref is not what is checked out here, so it cannot be checked;" >&2
    echo "        check it out and push again (the push stopped)" >&2
    exit 1
  fi
  echo "verify: every check before $remote_ref is pushed (task check)"
  check_here || {
    echo "verify: task check failed - nothing pushed" >&2
    exit 1
  }
  head_tree=$(git rev-parse 'HEAD^{tree}')
done

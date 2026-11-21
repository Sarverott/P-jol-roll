#!/usr/bin/env bash
# Merges <source> into the branch <target> and pushes it: master after a release back into
# development. The version merges by the driver of .gitattributes; a conflict fails loudly.
# Usage: merge-into.sh <source ref, e.g. origin/master> <target branch>
# shellcheck source=../_common.sh
source "$(dirname "$0")/../_common.sh"
source_ref="${1:?source ref}"
target="${2:?target branch}"

bot_identity
merge_driver
git fetch -q origin "$target"
git checkout -q -B "$target" "origin/$target"
git merge --no-ff --no-edit -m "chore(merge): $source_ref into $target" "$source_ref"
git push -q origin "$target"
echo "$source_ref merged into $target and pushed"

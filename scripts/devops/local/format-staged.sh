#!/usr/bin/env bash
# Biome's formatting and safe fixes done on what is about to be committed (pre-commit) or
# merged (pre-merge-commit), and staged again - the commit holds the formatted files.
# A file that also has edits not staged is only checked: staging it again would take
# those edits into the commit; Biome then stops the commit and names it.
# Usage: format-staged.sh   (task husky:pre-commit, task husky:pre-merge-commit)
# shellcheck source=../_common.sh
source "$(dirname "$0")/../_common.sh"
mapfile -t staged < <(git diff --cached --name-only --diff-filter=ACMR)
[ "${#staged[@]}" -gt 0 ] || exit 0
declare -A unstaged=()
while IFS= read -r file; do unstaged["$file"]=1; done < <(git diff --name-only)
whole=()
partly=()
for file in "${staged[@]}"; do
  if [ -n "${unstaged[$file]:-}" ]; then partly+=("$file"); else whole+=("$file"); fi
done
if [ "${#whole[@]}" -gt 0 ]; then
  npx biome check --write --no-errors-on-unmatched --files-ignore-unknown=true "${whole[@]}"
  git add -- "${whole[@]}"
fi
if [ "${#partly[@]}" -gt 0 ]; then
  npx biome check --no-errors-on-unmatched --files-ignore-unknown=true "${partly[@]}"
fi

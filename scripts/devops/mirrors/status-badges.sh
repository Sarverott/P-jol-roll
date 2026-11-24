#!/usr/bin/env bash
# The files of <badges dir> as the only commit of the branch `badges` (force-pushed, no
# history), read by shields.io: https://img.shields.io/endpoint?url=<raw file URL>.
# Built with git's plumbing, so the checked-out branch is never touched.
# Usage: status-badges.sh <badges dir>   (a checkout that may push to origin)
# shellcheck source=../_common.sh
source "$(dirname "$0")/../_common.sh"
badges="${1:?badges dir}"
if [ -z "$(find "$badges" -type f 2>/dev/null)" ]; then
  echo "no badges written: the branch badges stays as it is"
  exit 0
fi

tree=$(
  for file in "$badges"/*; do
    printf '100644 blob %s\t%s\n' "$(git hash-object -w "$file")" "$(basename "$file")"
  done | git mktree
)
commit=$(
  GIT_AUTHOR_NAME="github-actions[bot]" \
    GIT_AUTHOR_EMAIL="41898282+github-actions[bot]@users.noreply.github.com" \
    GIT_COMMITTER_NAME="github-actions[bot]" \
    GIT_COMMITTER_EMAIL="41898282+github-actions[bot]@users.noreply.github.com" \
    git commit-tree "$tree" -m "chore(badges): status of the source and its mirrors"
)
git push --quiet --force origin "$commit:refs/heads/badges"
echo "badges: $(find "$badges" -type f -printf '%f ')"

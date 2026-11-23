#!/usr/bin/env bash
# The devlog and the almanac copied into the wiki of GitHub (phase 28): the submodule docs/wiki
# is the wiki's repository; wiki.py writes the copy into it, then it is committed and pushed
# there, and the submodule's new commit is staged here for the next commit. The files of
# docs/devlog and docs/almanac stay where they are written - the wiki only shows them.
# Usage: wiki.sh   (task docs:wiki)
# shellcheck source=../_common.sh
source "$(dirname "$0")/../_common.sh"
wiki=docs/wiki
git submodule update --init "$wiki"
git -C "$wiki" checkout -q master
git -C "$wiki" pull -q --ff-only origin master
commit=$(git rev-parse HEAD)
python3 scripts/devops/docs/wiki.py "$wiki" "$commit"
if [ -z "$(git -C "$wiki" status --porcelain)" ]; then
  echo "$wiki: already the copy of ${commit:0:7}"
else
  git -C "$wiki" add -A
  git -C "$wiki" commit -q -m "the devlog and the almanac of P_JOL_ROLL at ${commit:0:7}"
  git -C "$wiki" push -q origin master
  echo "$wiki: $(git -C "$wiki" log --oneline -1) pushed to the wiki"
fi
git add "$wiki"
echo "the submodule's commit is staged - commit it with your next step"

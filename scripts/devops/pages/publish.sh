#!/usr/bin/env bash
# site/ alone, committed by the bot onto an orphan branch and force-pushed to <branch>
# (default github-pages), which GitHub Pages serves - the way Amoorion keeps its page.
# Usage: publish.sh [<what it is the website of, e.g. v0.1.0>] [<branch>]
# shellcheck source=../_common.sh
source "$(dirname "$0")/../_common.sh"
of="${1:-$(git rev-parse --short HEAD)}"
branch="${2:-github-pages}"
[ -d site ] || { echo "no site/ - run pages/build.sh first" >&2; exit 1; }

bot_identity
git checkout -q --orphan "pages-$RANDOM"
git --work-tree site add --all
git --work-tree site commit -q -m "website of $of, UNIXUSAT=$(date +%s%3N)"
git push -q origin "HEAD:$branch" --force
echo "site/ of $of pushed to $branch"

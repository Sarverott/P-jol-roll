#!/usr/bin/env bash
# Whoever stands behind a pull request into master is a member: listed in .github/AUTHORS of
# master, by a GitHub address in their line - (https://github.com/<login>) or the mail
# <id>+<login>@users.noreply.github.com. A contributor never listed there was never approved by
# the known contributors, so the gate (gate.yml) stops here and nothing is checked or merged.
# A pull request opened by a workflow of this repository (github-actions[bot]: phase-close)
# stands for the person who started that workflow: the run named in its description
# ("Opened by the run <id>", pull-request.sh), as GitHub recorded it.
# Usage: authors.sh <pull request number>   (needs GH_TOKEN)
# shellcheck source=../_common.sh
source "$(dirname "$0")/../_common.sh"
pr="${1:?pull request number}"
repo="${GITHUB_REPOSITORY:-$(gh repo view --json nameWithOwner --jq .nameWithOwner)}"

git fetch -q origin master
authors=$(git show origin/master:.github/AUTHORS)

listed() {
  local login="$1"
  [[ "$login" =~ ^[A-Za-z0-9-]+$ ]] || return 1
  grep -Eiq "\(https://github\.com/$login\)|<[0-9]+\+$login@users\.noreply\.github\.com>" <<<"$authors"
}

read -r author head <<<"$(gh api "repos/$repo/pulls/$pr" --jq '.user.login + " " + .head.label')"
who="$author"
if [ "$author" = "github-actions[bot]" ]; then
  run=$(gh api "repos/$repo/pulls/$pr" --jq '.body' | sed -nE 's/.*Opened by the run ([0-9]+).*/\1/p' | head -n1)
  if [ -z "$run" ]; then
    echo "#$pr was opened by a workflow that does not say which run opened it" >&2
    exit 1
  fi
  read -r path who <<<"$(gh api "repos/$repo/actions/runs/$run" --jq '.path + " " + .triggering_actor.login')"
  if [ "$path" != ".github/workflows/phase-close.yml" ]; then
    echo "#$pr names the run $run, which is not a phase-close of this repository ($path)" >&2
    exit 1
  fi
  echo "#$pr was opened by phase-close, the run $run started by $who"
fi

if listed "$who"; then
  echo "#$pr ($head): $who is listed in .github/AUTHORS of master"
else
  echo "#$pr ($head): $who is not listed in .github/AUTHORS of master - never approved by the known contributors" >&2
  exit 1
fi

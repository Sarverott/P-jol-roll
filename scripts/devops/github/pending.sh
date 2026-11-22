#!/usr/bin/env bash
# Runs that wait for a person's approval (action_required): listed, and approved with --approve.
# Usage: pending.sh [--approve]   (task github:pending)
# shellcheck source=../_common.sh
source "$(dirname "$0")/../_common.sh"
repo=$(gh repo view --json nameWithOwner --jq .nameWithOwner)
mapfile -t runs < <(gh run list --status action_required --limit 50 --json databaseId,workflowName,headBranch,event \
  --jq '.[] | "\(.databaseId)\t\(.workflowName)\t\(.headBranch)\t\(.event)"')
if [ "${#runs[@]}" = 0 ]; then
  echo "no run waits for approval"
  exit 0
fi
printf '%s\n' "${runs[@]}"
[ "${1:-}" = "--approve" ] || { echo "approve them: task github:pending -- --approve"; exit 0; }
for line in "${runs[@]}"; do
  id="${line%%$'\t'*}"
  if gh api -X POST "repos/$repo/actions/runs/$id/approve" >/dev/null 2>&1; then
    echo "$id approved"
  else
    # not a run from a fork: run it again, which needs no approval of the website
    gh run rerun "$id" && echo "$id started again"
  fi
done

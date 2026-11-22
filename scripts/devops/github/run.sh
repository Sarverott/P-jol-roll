#!/usr/bin/env bash
# A workflow started from a terminal (workflow_dispatch), on development unless --ref says
# otherwise, and the address of its run printed - no website needed.
# Usage: run.sh <workflow file or name> [--ref <branch>] [-f key=value ...]   (task github:run)
# shellcheck source=../_common.sh
source "$(dirname "$0")/../_common.sh"
workflow="${1:?workflow, e.g. checks.yml}"
shift
ref=development
args=()
while [ $# -gt 0 ]; do
  case "$1" in
    --ref) ref="${2:?branch}"; shift 2 ;;
    *) args+=("$1"); shift ;;
  esac
done
before=$(gh run list --workflow "$workflow" --limit 1 --json databaseId --jq '.[0].databaseId // 0')
gh workflow run "$workflow" --ref "$ref" "${args[@]}"
# the new run appears after a moment
for _ in 1 2 3 4 5 6 7 8 9 10; do
  run=$(gh run list --workflow "$workflow" --limit 1 --json databaseId,url --jq '.[0] | "\(.databaseId) \(.url)"')
  [ "${run%% *}" != "$before" ] && break
  sleep 2
done
echo "$workflow on $ref: ${run#* }"
echo "follow it: gh run watch ${run%% *}   (or task github:watch)"

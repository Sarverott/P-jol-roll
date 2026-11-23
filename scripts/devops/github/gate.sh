#!/usr/bin/env bash
# The gate (gate.yml) of a pull request into master run again from a terminal, on the pull
# request's head branch, so the checks see what would be merged.
# Usage: gate.sh <pull request number>   (task github:gate)
# shellcheck source=../_common.sh
source "$(dirname "$0")/../_common.sh"
pr="${1:?pull request number}"
head=$(gh pr view "$pr" --json headRefName --jq .headRefName)
"$(dirname "$0")/run.sh" gate.yml --ref "$head" -f pr="$pr"

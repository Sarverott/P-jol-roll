#!/usr/bin/env bash
# Asks GitHub to close a phase: the workflow "flow › close a phase" bumps Y, pushes
# development and opens the pull request to master (flow/phase-close.sh).
# Usage: phase-close.sh <phase number>   (task flow:phase-close -- <n>; needs gh logged in)
# shellcheck source=../_common.sh
source "$(dirname "$0")/../_common.sh"
phase="${1:?phase number}"
gh workflow run phase-close.yml --ref development -f phase="$phase"
echo "phase $phase: the workflow is started - task github:runs shows it"

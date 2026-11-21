#!/usr/bin/env bash
# Runs shellcheck over every script of scripts/devops/ (settings: scripts/devops/.shellcheckrc).
# Usage: shellcheck.sh   (needs shellcheck; the runners of GitHub have it)
# shellcheck source=../_common.sh
source "$(dirname "$0")/../_common.sh"
find scripts/devops -name '*.sh' -print0 | xargs -0 shellcheck -x
echo "shellcheck: scripts/devops clean"

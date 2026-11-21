#!/usr/bin/env bash
# The website into site/: the MkDocs site of docs/ (strict, locked tools).
# Usage: build.sh   (needs uv and task)
# shellcheck source=../_common.sh
source "$(dirname "$0")/../_common.sh"
task docs:build
touch site/.nojekyll

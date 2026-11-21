#!/usr/bin/env bash
# The website into site/: the MkDocs site of docs/ under site/docs/ (strict, locked tools),
# then the React introduction of webpage/ at the root, beside it (it does not empty site/).
# SITE_URL is the address of the root; MkDocs gets SITE_URL/docs/.
# Usage: build.sh   (needs uv and npm)
# shellcheck source=../_common.sh
source "$(dirname "$0")/../_common.sh"
root_url="${SITE_URL:-http://127.0.0.1:8000/}"

rm -rf site
SITE_URL="${root_url%/}/docs/" uv run --project docs mkdocs build --strict -f docs/mkdocs.yml -d ../site/docs
npm ci --prefix webpage --no-audit --no-fund
npm run --prefix webpage build
touch site/.nojekyll
echo "site/: the introduction at the root, the documentation in docs/"

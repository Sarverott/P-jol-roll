#!/bin/sh
# case -gather-and-parse: on Parrot OS, TypeScript builds, and the whole gathering runs against
# the local copy of the API in tests/gather.test.ts (lists, listings, files, changes), then
# tables, markdown and checksums are made from what was gathered. Nothing asks the internet.
set -eu
echo "case -gather-and-parse on $(. /etc/os-release && echo "$PRETTY_NAME"), node $(node --version)"
npx tsc
npx vitest run tests/gather.test.ts

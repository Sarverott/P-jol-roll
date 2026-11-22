#!/usr/bin/env bash
# The demo space follows the releases: the FROM of resources/space/Dockerfile is set to the
# image of a release (the newest tag by default), so the next push of the space changes a file
# and Hugging Face builds it again - a restart alone keeps the image it had (phase 15). Only
# the local side is written; pushing the space stays the owner's (task resources:push -- space).
# It also keeps the cache and logs of the space off the bucket mounted at /data.
# Usage: space.sh [vX.Y.Z]
# shellcheck source=../_common.sh
source "$(dirname "$0")/../_common.sh"
dockerfile=resources/space/Dockerfile
[ -f "$dockerfile" ] || { echo "$dockerfile is missing - task resources:pull -- space" >&2; exit 1; }
git fetch -q --tags origin 2> /dev/null || true
tag="${1:-$(git tag --list 'v*' --sort=-v:refname | head -n 1)}"
[ -n "$tag" ] || { echo "no release tag found" >&2; exit 1; }
version="${tag#v}"
image="ghcr.io/sarverott/p-jol-roll-webapp-server"
before=$(grep -m 1 '^FROM ' "$dockerfile" || true)
sed -i -E "s|^FROM ${image}:[^[:space:]]+|FROM ${image}:${version}|" "$dockerfile"
after=$(grep -m 1 '^FROM ' "$dockerfile")
if [ "$before" = "$after" ]; then echo "already $after"; else echo "$before -> $after"; fi
# the space mounts the bucket at /data, where the image keeps its cache and logs by default:
# they are kept in /tmp, or every page read is written into the bucket (phase 20)
if ! grep -q '^ENV RESOURCES_DIR=' "$dockerfile"; then
  printf '%s\n' '# the bucket is mounted at /data: the cache of pages and the logs stay off it (phase 20)' \
    'ENV RESOURCES_DIR=/tmp/p-jol-roll/resources LOG_DIR=/tmp/p-jol-roll/logs' >> "$dockerfile"
  echo "RESOURCES_DIR and LOG_DIR moved off /data (the bucket)"
fi
echo "now: task resources:push -- space (and task resources:prune -- space for old files)"

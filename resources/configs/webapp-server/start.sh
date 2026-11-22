#!/bin/sh
# Start of webapp-server: RESOURCES_DIR gets the map of repositories when it has none.
# DATASET_URL and BUCKET_URL (the demo space) read the copies on Hugging Face page by page
# (src/core/reading/remote.ts); PULL=dataset instead takes the whole dataset in the background
# while the api already answers - for a server that is to have all of it.
set -eu
mkdir -p "$RESOURCES_DIR" "$LOG_DIR" 2> /dev/null || true
for f in .map.json frontends.json; do
  [ -e "$RESOURCES_DIR/$f" ] || cp "/app/seed/$f" "$RESOURCES_DIR/$f" 2> /dev/null || true
done
if [ -n "${PULL:-}" ]; then
  for name in $PULL; do
    node dist/core/main.js hub pull "$name" --parallel "${PULL_PARALLEL:-16}" &
  done
fi
exec node dist/openapi/main.js

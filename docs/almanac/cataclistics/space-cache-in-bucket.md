---
id: space-cache-in-bucket
labels: [bug]
status: solved
issue:
---

# The demo space writes its cache into the bucket

**Status:** solved · **Topic:** [hugging-face](../solutions/hugging-face.md) ·
**Chain:** `space:bucket-mounted → space:page-read → bucket:stray-dirs`

## What happened

The bucket of raw files held `resources/` (`.map.json`, `frontends.json`, tables and texts of the dataset, a few raw files) and `logs/` next to `DU/`, `MP/` and `sejm/`, growing with every page the demo showed; the owner found them while the parquet files were being made.

## Cause

The space mounts the bucket at `/data`, read and write. The image of webapp-server keeps its cache (`RESOURCES_DIR=/data/resources`) and its logs (`LOG_DIR=/data/logs`) in `/data`, the place meant for a volume of its own. Nothing pushed them: the remote mode cached each page it read, straight into the bucket.

## Solution

The space's `Dockerfile` sets `RESOURCES_DIR` and `LOG_DIR` in `/tmp`, and `task resources:space` adds that line when it is missing; the 25945 files the space wrote were deleted from the bucket by their paths (`resources/`, `logs/`), the raw files left as they were.

## Seen

- 2026-11-22: changelog phase 20
- v0.17.0

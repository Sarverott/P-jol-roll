---
id: hub-push-never-deletes
labels: [bug]
status: solved
issue:
---

# The demo space keeps files of its old version

**Status:** solved · **Topic:** [hugging-face](../solutions/hugging-face.md) ·
**Chain:** `space:rewritten → hub:push → space:old-files-stay`

## What happened

After the space moved from marimo to the image of webapp-server, it still held `app.py` and `requirements.txt`; the owner saw "updates not presented" on restart.

## Cause

`push` sends what is new or changed here and never deletes there.

## Solution

`task resources:prune -- space` deletes there what is not here, in commits of 1000, after a question; it refuses the bucket, whose raw files may live on one machine only. `task resources:space` writes the newest release into the space's Dockerfile, so the next push rebuilds it.

## Seen

- 2026-11-22: Q16, changelog phase 12
- v0.14.x

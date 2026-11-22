---
id: hyparquet-zstd
labels: [bug]
status: solved
issue:
---

# The viewer cannot read the vectors

**Status:** solved · **Topic:** [viewer](../solutions/viewer.md) ·
**Chain:** `embed:parquet-zstd → hyparquet:unsupported`

## What happened

Parquet written with zstd could not be read by hyparquet alone.

## Cause

hyparquet reads snappy without an extra package.

## Solution

`scripts/embeddings/embed.py` writes snappy.

## Seen

- 2026-11-22: phase 17

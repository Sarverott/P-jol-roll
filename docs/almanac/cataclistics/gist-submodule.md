---
id: gist-submodule
labels: [bug]
status: solved
issue:
---

# The media submodule points at an empty commit, then breaks the lint

**Status:** solved · **Topic:** [repository](../solutions/repository.md) ·
**Chain:** `submodule:add → pointer:empty-commit → biome:formats-submodule → check:failed`

## What happened

The first staged pointer of `resources/mediafiles` was the gist's empty first commit; then Biome formatted the gist's `.index.json` and failed `task check`.

## Cause

A submodule added before its first content was pushed; Biome walks into submodules.

## Solution

The commit with the images committed as a second change; the submodule left out of Biome.

## Seen

- 2026-11-22: phase 13

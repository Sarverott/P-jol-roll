---
id: vite-glob-dotfiles
labels: [bug]
status: solved
issue:
---

# The index of language packs is missing from the viewer

**Status:** solved · **Topic:** [translations](../solutions/translations.md) ·
**Chain:** `build:web → vite:glob → pack-index:missing`

## What happened

`import.meta.glob` found every pack but `.index.json`.

## Cause

Vite's glob skips dotfiles.

## Solution

`.index.json` is imported by name, the packs by the glob.

## Seen

- 2026-11-22: phase 16

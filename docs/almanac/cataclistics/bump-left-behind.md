---
id: bump-left-behind
labels: [bug]
status: solved
issue:
---

# A refused commit leaves its version bump in the working tree

**Status:** solved · **Topic:** [github-workflows](../solutions/github-workflows.md) ·
**Chain:** `commit → hook:bump-version → commitlint:header-too-long → version:left-behind`

## What happened

Twice a commit was refused for a header over 100 characters, and `package.json` with its copies stayed bumped.

## Cause

The bump runs in pre-commit, before commit-msg checks the message.

## Solution

Headers stay short (`flow:land` too); when it happens, `npm pkg set version=<previous>` and `task version:sync` put it back. Earlier a hook stopped after the bump for Biome, so the bump runs after Biome.

## Seen

- 2026-11-22: phases 15-17

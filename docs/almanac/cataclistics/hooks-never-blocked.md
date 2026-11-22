---
id: hooks-never-blocked
labels: [bug, dependencies]
status: solved
issue:
---

# The git hooks printed errors and let every commit through

**Status:** solved · **Topic:** [dependencies](../solutions/dependencies.md) ·
**Chain:** `commit → hook:biome-failed → go-task:exit-0 → commit:accepted`

## What happened

A failed Biome check in pre-commit printed its errors and the commit went on - since the hooks were made.

## Cause

`@go-task/cli` 3.45.4 runs the task binary and throws its exit code away; `npm audit fix` had moved it back to that version.

## Solution

`@go-task/cli` `^3.54.0`, which ends with the task's code. A bad message or a badly formatted file stops the commit now (exit 201).

## Seen

- 2026-11-13: notes of agents

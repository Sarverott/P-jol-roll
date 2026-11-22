---
id: forced-audit-downgrade
labels: [bug, dependencies]
status: solved
issue:
---

# `npm audit fix --force` moved packages backwards

**Status:** solved · **Topic:** [dependencies](../solutions/dependencies.md) ·
**Chain:** `npm:audit-fix-force → npm:downgrade → build:module-missing`

## What happened

The durable runs failed to build (`Cannot resolve module "workflow/nitro"`); `crawlee` stayed 3.2.2 while its range allowed 3.18.2.

## Cause

The forced fix of 2026-10-14 put `workflow` 5.2.2 back to 2.0.6, an older and different package, and `camoufox-js` to 0.8.

## Solution

The ranges put back, `npm update`, then `npm audit fix` without `--force`; advisories that remain are judged by whether data from outside reaches them.

## Seen

- 2026-11-13: notes of agents

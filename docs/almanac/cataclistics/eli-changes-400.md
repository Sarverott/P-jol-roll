---
id: eli-changes-400
labels: [bug]
status: solved
issue:
---

# `gather:changes` fails: the API wants a time, not a day

**Status:** solved · **Topic:** [source-api](../solutions/source-api.md) ·
**Chain:** `gather:changes → eli:400 → crawlee:logged-only → run:exit-0`

## What happened

`/changes/acts?since=2026-11-01` answered 400, and the run ended with 0.

## Cause

Since about November 2026 the API wants `yyyy-MM-ddTHH:mm:ss`; Crawlee only logged the failed request.

## Solution

The day is sent with a time; a run whose requests failed ends with 1.

## Seen

- 2026-11-22: phase 9

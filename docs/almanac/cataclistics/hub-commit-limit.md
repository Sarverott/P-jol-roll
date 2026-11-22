---
id: hub-commit-limit
labels: [bug]
status: solved
issue:
---

# Hugging Face refuses the 129th commit of an hour

**Status:** solved · **Topic:** [hugging-face](../solutions/hugging-face.md) ·
**Chain:** `hub:push → hub:commit-per-100-files → hub:429`

## What happened

`hub push dataset` crashed at 12800 of 14170 files with 429 and "You can retry this action in about 1 hour".

## Cause

Hugging Face takes 128 commits an hour per repository; the push made one commit per 100 files.

## Solution

A refused commit is waited out (the time read from the message, an hour when none is named, a minute more) and sent again; commits hold 1000 files (`--batch`). 128 commits of 1000 an hour is what the owner accepted (Q16). `rateLimitWait()` and `committed()` in `src/core/resources/hub.ts`, `tests/hub.test.ts`.

## Seen

- 2026-11-22: logs/log-1795316429823-verbose-hub-push.log
- v0.11.x

---
id: checked-before-last-change
labels: [bug]
status: solved
issue:
---

# A batch landed after its checks ran, before its last change

**Status:** solved · **Topic:** [repository](../solutions/repository.md) ·
**Chain:** `check:pass → commit:after-check → flow:land → ci:fail`

## What happened

The pull request of phase 23 (#39) failed its checks before it was merged:
`tests/almanac.test.ts` - "every chain has its page, its topic, and the page
names it back". The title of the new case was written with backticks on its
page and without them in its chain. Cleo had reported "task check passes".

## Cause

`task check` ran after the fix and before the almanac case was written; the
case was committed and landed without a second run. The hooks do not stop
it: pre-commit and pre-push run Biome only, the tests run in CI. It is the
same slip every time - a report true of an earlier tree - so it was bound to
come back with any last small change (docs, a case, a version).

## Solution

`task flow:land` runs `task check` itself, on exactly the commit that lands,
and lands nothing when it fails (`scripts/devops/local/land.sh`). The check
is part of landing, not something remembered before it. The title of the
case is plain text on both sides: an issue's title on GitHub shows no
markdown anyway.

## Seen

- 2026-11-22: phase 23, pull request #39

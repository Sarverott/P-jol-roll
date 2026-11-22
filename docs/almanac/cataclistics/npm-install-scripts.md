---
id: npm-install-scripts
labels: [bug, dependencies]
status: solved
issue:
---

# A fresh install has no `task` binary

**Status:** solved · **Topic:** [dependencies](../solutions/dependencies.md) ·
**Chain:** `npm:install → npm11:scripts-blocked → task:missing`

## What happened

On a new machine `npm ci` passed and `task` was not there.

## Cause

npm 11 blocks install scripts until they are reviewed; `@go-task/cli` downloads the binary in one.

## Solution

`allowScripts` in `package.json`: `@go-task/cli`, `esbuild`, `@swc/core` allowed; the rest denied with the reason.

## Seen

- 2026-11-13: notes of agents

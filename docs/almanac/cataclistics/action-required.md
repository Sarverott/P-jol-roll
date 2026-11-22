---
id: action-required
labels: [github_actions]
status: as designed
issue:
---

# Checks of a pull request opened by a workflow wait for a person

**Status:** as designed · **Topic:** [github-workflows](../solutions/github-workflows.md) ·
**Chain:** `phase-close:pull-request → checks:action-required`

## What happened

The checks of #23 (and of each phase-close pull request since) showed "action required".

## Cause

Runs started by a pull request that GitHub Actions itself opened wait for a person to approve them.

## Solution

Left as GitHub made it: the owner approves them. Agents do not.

## Seen

- 2026-11-22: #23, #28, #29

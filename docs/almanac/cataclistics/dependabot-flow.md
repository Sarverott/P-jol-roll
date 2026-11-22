---
id: dependabot-flow
labels: [bug, github_actions]
status: solved
issue:
---

# Dependabot's pull requests do not land by themselves

**Status:** solved · **Topic:** [github-workflows](../solutions/github-workflows.md) ·
**Chain:** `dependabot:pull-request → workflow:old-scripts → merge:failed`

## What happened

The first one (#18) failed in its merge job; security updates (#19-#22) opened against master.

## Cause

The job checked out `dev/dependabot`, made before the scripts existed; security updates ignore `target-branch`; `gh pr edit --base` said yes and changed nothing; a retarget starts no workflow.

## Solution

Jobs take scripts from `development`; the workflow turns security updates to `dev/dependabot`; the four open ones were turned through the API and started by `@dependabot rebase`.

## Seen

- 2026-11-22: #18-#22, phase 10

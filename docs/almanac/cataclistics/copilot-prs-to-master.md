---
id: copilot-prs-to-master
labels: [github_actions]
status: solved
issue:
---

# Copilot's pull requests open against master

**Status:** solved · **Topic:** [github-workflows](../solutions/github-workflows.md) ·
**Chain:** `codeql:alerts → copilot:autofix → pull-request:into-master → merge:wrong-branch`

## What happened

Three autofixes of CodeQL alerts (#31, #32, #33) were opened from `dev/Copilot`,
`dev/Copilot-2` and `dev/Copilot-3` against `master`, past `development` and the
release. Two of them were the same change. The fix of the cache-poisoning alert
would also have made Dependabot's checks run on the wrong commit.

## Cause

GitHub opens Copilot's pull requests against the default branch, and Copilot
had no guide to this repository's loop. A fix that changes which commit a
workflow runs on has to be followed through every caller.

## Solution

Copilot became a member, **Jarvis**, with its own branch `dev/Jarvis`, as
Dependabot has `dev/dependabot`. `bots.yml` turns a bot's pull request to its
branch and merges it (Jarvis's when it is no longer a draft). It dispatches
`checks.yml` on the branch's own commit, and `bots-land.yml` lands the green
commit in `development`. `checks.yml` takes no ref from outside any more,
which also ends the cache-poisoning alert. Jarvis's guide is
`.github/copilot-instructions.md`, with prompts in `.github/prompts/` and
its machine in `copilot-setup-steps.yml`.

## Seen

- 2026-11-22: #31, #32, #33
- v0.16.x

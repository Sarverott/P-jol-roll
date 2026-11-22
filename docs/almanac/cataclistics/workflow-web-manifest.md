---
id: workflow-web-manifest
labels: [bug]
status: solved
issue:
---

# The web interface of the workflows lists none

**Status:** solved · **Topic:** [terminal](../solutions/terminal.md) ·
**Chain:** `workflows:build → workflows:web → web:no-workflows`

## What happened

The owner opened the web interface of the Workflow SDK and saw "No Workflows Found" (a note in `src/workflows/nitro.config.ts`).

## Cause

`workflow web` looks for the manifest of the workflows in `.well-known/workflow/v1/` of the folder it starts in; Nitro writes it into its build folder, `src/workflows/node_modules/.nitro/workflow/manifest.json`. No run had been started either, so the list of runs was empty too.

## Solution

`task workflows:web` names the manifest (`WORKFLOW_MANIFEST_PATH`), the data of the runs and the server; `task workflows:serve` keeps runs in the same `.workflow-data` wherever it starts. Runs appear after `task workflows:daily`.

## Seen

- 2026-11-22: phase 21

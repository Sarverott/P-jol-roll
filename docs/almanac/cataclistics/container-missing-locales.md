---
id: container-missing-locales
labels: [bug]
status: solved
issue:
---

# The release image does not build: language packs left out of the Docker context

**Status:** solved · **Topic:** [containers](../solutions/containers.md) ·
**Chain:** `merge:master → release:image-build → tsc:module-not-found`

## What happened

The release of v0.15.0 failed in "Build and push to ghcr.io": `src/i18n/browser.ts(3,23): error TS2307: Cannot find module '../../resources/locales/.index.json'`. It looked like CodeQL had stopped it; it had not.

## Cause

`.dockerignore` lets only a few files of `resources/` into the context, and the packs of phase 16 were not among them. `task check` builds from the working tree, so it never saw the gap.

## Solution

`!resources/locales/` in `.dockerignore`; the Dockerfile copies the packs into the build (the viewer bundles them) and beside `dist/` (node reads them). Checked by building the image here and serving the site from it.

## Seen

- 2026-11-22: run 45005803900
- v0.15.1

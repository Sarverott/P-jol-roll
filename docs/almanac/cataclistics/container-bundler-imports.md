---
id: container-bundler-imports
labels: [bug]
status: solved
issue:
---

# The release image does not build: the viewer imported a file outside `src/` by `?raw`

**Status:** solved · **Topic:** [containers](../solutions/containers.md) ·
**Chain:** `release:container → astro:build → vite:unresolved-import`

## What happened

The release of v0.19.0 pushed no image: the job `container` stopped in
`npm run build` with `[UNRESOLVED_IMPORT] Could not resolve
'../../../.github/AUTHORS?raw' in src/gui/data/credits.js`. The checks and
every local build had passed.

## Cause

Two things at once. The image copies only `src/` (and a few files of
`resources/`); `.dockerignore` keeps `.github` and `webpage` out, so the
file was not there. And the import itself was a bundler's trick - `?raw`,
`?url` and imports of `.yaml` work only through Vite's own handling, so
the code depended on a build tool's dialect to read a plain file. The
owner: "sounds glitchy... abandon this ways of imports".

## Solution

No imports with `?raw` or `?url`, and no plugin that imports yaml:

- the website reads what it needs while it is built with plain `node:fs`
  (`src/web/data/files.ts`): `site.yaml`, and `.github/AUTHORS` with the
  introduction's `links.yaml` for "Terms of use", which reach the viewer as
  a prop (`credits`);
- the web app manifest is served by an endpoint, `/manifest.webmanifest`;
- the introduction turns its yaml into `src/lists.json` before its build
  (`webpage/scripts/state.mjs`) and imports plain JSON.

The image copies the two files the website reads, and `.dockerignore`
lets them in by name. Before a release, `docker build -f
resources/configs/webapp-server/Dockerfile .` shows what `task check`
cannot.

## Seen

- 2026-11-22: release v0.19.0 (phase 22)

# Phase 23: the image builds again, without a bundler's dialect

Append-only: sections are added at the end and never rewritten. Each starts
with `UNIXUSAT=<ms since epoch> · commit <hash>`. The owner's words are kept
word for word.

## UNIXUSAT=1795376237670 · commit 8a8820a

The owner's message in the chat, 2026-11-22, after the release of v0.19.0
(#37 merged). Word for word:

```text
container building fails... check logs, because it was related with astro while building the code actually. looks like your import of AUTHORS does not work there. i'm suppriset that something like that questionmark and pstfix "raw" does something. maybe instead of this way you will try more convinient methods. i googled it out and it is boundler-specific syntax... sounds glitchy... abandon this ways of imports please, they are a bit of stinky loads. if somewhere elsewhere you does that please replace it there too.
```

The job `container` of the release run 45060570196 stopped in `npm run
build`: `Could not resolve '../../../.github/AUTHORS?raw' in
src/gui/data/credits.js` - the image copies only `src/`, and the import
was Vite's own dialect. Three more such imports were found: `site.yaml?raw`,
`manifest.json?url`, and the yaml of the introduction imported through a
plugin of Vite.

**What was done:** no import with `?raw` or `?url` is left, nor the
plugin. The website reads files with plain `node:fs` while it is built
(`src/web/data/files.ts`); "Terms of use" gets the authors and links as a
prop of the viewer (`src/web/data/credits.ts`); the manifest is the
endpoint `/manifest.webmanifest`; the introduction makes `src/lists.json`
from its yaml before its build and imports plain JSON. The image copies
`.github/AUTHORS` and `links.yaml`, let in by name in `.dockerignore`;
`docker build` of the image passed here. The case is in the almanac
(`container-bundler-imports`).

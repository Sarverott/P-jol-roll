# Phase 21: the owner's notes across src

Append-only: sections are added at the end and never rewritten. Each starts
with `UNIXUSAT=<ms since epoch> · commit <hash>`. The owner's words are kept
word for word.

## UNIXUSAT=1795362940969 · commit c66c659

The owner's message in the chat, 2026-11-22, after phase 20. With it, notes
left across `src/` (and `webpage/`), committed as they were on
`dev/Sarverott` (formatted by Biome; one `export` made valid). Word for word:

```text
alright... push changes to remote, then check what i made there for you now - rest as usual. my feedback for you: not bad but could be better, i made a lot of note commentary across src files there.
```

The space was already pushed by the owner with the change of phase 20 (the
image 0.17.0, its cache in `/tmp`); the 12 files it had written into the
bucket before that were deleted. Each note is answered next to itself
(`ANSWER:`), as AGENTS.md rule 3 says.

**What was done:** Biome formats in `pre-commit` and `pre-merge-commit`
and checks in `pre-push`, templates and styles too. `at()` lives in
`src/core/paths/at.ts`; the version fields share one pattern. The viewer
is made of `layout/`, `screens/` (acts with full pages, an act on its own
screen, the map) and `components/`, with `ColorPick`, the graph, the
socket, the shared state and the address (`#act/DU/2026/1`) in
`assets/`; the minimap stays on both screens of acts. Only what a page
marks by `i18n-texts-*` is translated; SHA-256 comes from
`@noble/hashes`. MCP has a folder per tool and is served by the api at
`/mcp` as well as over stdio. The website's words are in
`src/web/data/site.yaml`, with `robots.txt`, `sitemap.xml` and `llms.txt`;
the introduction's lists are yaml and the page is components. The web
interface of the workflows finds them. The desktop app is put together
from the modules laid out. Two questions wait: Q17 (Web Serial and Web
Bluetooth), Q18 (the devil's advocate screen).

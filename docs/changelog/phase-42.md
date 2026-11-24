# Phase 42: international law adopted by Poland

Append-only: sections are added at the end and never rewritten. Each starts
with `UNIXUSAT=<ms since epoch> · commit <hash>`. The owner's words are kept
word for word.

## UNIXUSAT=1795534906967 · commit 979fb293

The order of phase 41 goes on (its words in changelog phase 41): "let's add
to our dataset and into bucket also international sets of laws that are
adopted by Poland besides own codex of laws".

Built along the *Lean* of Q22 (issue #140), which waits for the owner's
answer and may widen or narrow it:

- **The law of the European Union** (`task eu`): every act of a year from
  the Publications Office of the EU - its SPARQL endpoint (CELLAR): CELEX,
  date, kind, in force or not, the Polish title, ELI - into
  `dataset/EU/acts/<year>.jsonl`; with `--texts` the Polish text of each
  act in force (not of corrigenda) by content negotiation, into
  `bucket/EU/<year>/`. Its listing of 2024 taken here: 3,765 acts, 2,310 in
  force.
- **The international agreements the journals published** (`task
  international`): agreements, conventions, protocols, treaties, the
  documents ending them and the government's statements, indexed from the
  listings here with no request - 9,480 of them.
- Both readable in every interface: MCP `eu_law` and `agreements`,
  `/api/eu`, `/api/eu/<year>`, `/api/eu/act/<CELEX>`, `/api/agreements`, the
  catalog.

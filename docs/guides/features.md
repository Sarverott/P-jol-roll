# What P_JOL_ROLL can do

Every function of the project, with how sure we are that it works. Updated
with the work; the plan for what is missing is in
[the devlog](../devlog/TODO.md), older ideas in
[ideas](../agents/ideas.md).

| Mark | Means |
| ---- | ----- |
| **works** | used on real data, or checked end to end against a local copy of the source; how is said |
| **built** | written and covered by tests or a smoke run, never used on the real thing |
| **wanted** | asked for or planned, not built |

State of 2026-11-13.

## Gathering

| Function | Command | State |
| -------- | ------- | ----- |
| Lists and listings of every year, both journals (DU, MP) | `task gather -- --all` | **works**: the owner's machine listed all 164,638 acts in October 2026 |
| Files of acts: details, references, PDF, HTML | `task gather -- 2026 --acts --limit 5`, `task gather:everything` | **works**: DU 1918-1933 and part of 2026 gathered (34,482 files, 10 GB); the rest is being gathered on the external machine |
| Structure of a text, other texts (`U`, `T`) of an act | parts `struct`, `texts` of `gather` | **built**: tests and one real request each for the shape |
| Interrupt and start again, nothing asked twice | Ctrl+C, then the same command | **works**: files appear only when whole; checksum records say what is here |
| Daily changes | `task gather:changes` | **built**: tests against a local copy; one real request for the shape |
| Checksum records of every file | `task seal`, `task seal -- --check` | **works**: run over the 34,482 real files into a scratch directory, 0 differ |
| Work of Sejm: processes, prints | `task sejm -- 10 --files --limit 50` | **built**: tests; one real request per address |
| Court judgments of SAOS | `task saos -- 2025 --limit 3` | **built**: tests; one real request; republishing terms not checked |
| Websites that show acts, visited by a browser | `task checkup -- 2026 --limit 6` | **built**: run against a local page only |
| Votings, transcripts, interpellations of Sejm | | **wanted** |
| Open data portal, court register, statistics, national bank | | **wanted** (looked at, see [ideas](../agents/ideas.md)) |
| European law | | **wanted**, put off by the owner |

## Processing

| Function | Command | State |
| -------- | ------- | ----- |
| Tables of details and references, the graph of ties | `task compile` | **works**: real files of 1918-1933 into a scratch directory, 45,658 ties of 11,008 acts |
| Markdown from HTML, with checksums of both | `task text` | **works** on acts of 1918-1933 (1,464 files); newer HTML and tables not seen |
| Markdown from PDF (three quarters of acts have only a PDF) | | **wanted** |
| Texts by article, unified texts preferred | | **wanted** |
| A dataset for training a model; an advisor agent | | **wanted** (the far goal) |

## Keeping and moving

| Function | Command | State |
| -------- | ------- | ----- |
| Compare local data with Hugging Face | `task resources:plan -- dataset` | **works**: run by the owner |
| Send or take only what differs | `task resources:push` / `pull -- dataset` | **built**: never run by an agent (sending is the owner's move) |
| Daily run that waits for "yes" before pushing | `task workflows:daily`, `workflows:approve` | **built**: end to end against a local copy, with "no" and with no answer; Q9 asks whether to keep it |
| Gathering on a second machine | | **wanted**: a guide, and the trouble on Parrot OS (Q1, Q10) |

## Reading and showing

| Function | Command | State |
| -------- | ------- | ----- |
| Http api with OpenAPI description and live notices | `task serve` | **works**: tests, and a browser over the real listings |
| Website: the viewer of acts | `task web:build`, then `task serve` | **works**: headless browser over the real listings (list, act, PDF link) |
| MCP server for AI agents, read-only | `task mcp` | **built**: tools listed and called over stdio |
| Desktop window | `task desktop` | **built**: opened by the owner, the port problem fixed afterwards and not opened again |
| Android app | `task app:sync` | **wanted**: configured, Capacitor not installed |
| Browser extension (Firefox, Chrome) | `task extension` | **built**: citations read from seven examples; not loaded in a browser |
| Container: website and api | `docker compose up` | **built**: image never built |
| Terminal interface (termui) | | **wanted**: an experiment, Q4 |
| Website of the project: idea and state | | **wanted**: phase 4 |
| Links to acts in the Hugging Face space | | **wanted** |

## Development

| Function | Command | State |
| -------- | ------- | ----- |
| All checks | `task verify` | **works**, except the termui experiment (Q4) |
| Checks on GitHub | `.github/workflows/checks.yml` | **built**: simulated locally; nothing pushed yet (Q2) |
| Hooks: Biome before a commit, conventional messages | git hooks | **works**: both refuse bad input (since 2026-11-13; before that they never blocked) |
| Dependency updates | `.github/dependabot.yml` | **built**: active once it reaches `master` |

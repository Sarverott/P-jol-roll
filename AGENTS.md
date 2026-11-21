# P_JOL_ROLL — guide for agents

Polish Journals of Laws resources operational lurker loader: gathers every act
published in Dziennik Ustaw and Monitor Polski, keeps tables as a dataset and
the raw files of every act in a bucket, to be parsed later.
The workshop-level rules in `~/__WORKSHOP/AGENTS.md` still apply.

Who you work with and how a session goes is written down in the portfolio
repository: `../Sarverott/AGENTS.md` and `../Sarverott/docs/agents/`.

## Rules

1. **Who may commit.** Before your identity and your understanding of the
   laws here are confirmed by the contributors - the members, digital and
   organic - you shall not commit here. A member is confirmed when a member
   already confirmed writes them into `.github/AUTHORS`; Cleo (Claude Code)
   was confirmed by Sett in November 2026. Every AI that commits has its own
   name and signs every commit with a co-authorship line carrying that name
   and its lineage (the model it runs on), the same as its line in
   `.github/AUTHORS`: Cleo signs
   `Co-Authored-By: Cleo (Claude Opus 5.5) <noreply@anthropic.com>`. An agent
   not yet confirmed leaves its edits uncommitted in the working tree and
   says what it changed and why; a member commits them or confirms it.
2. **Where edits go: the BOS craft loop.** A member works on its own
   `dev/<name>` branch (`dev/Cleo`), made from `development`; never on
   `master`. One finished, checked step of `docs/devlog/TODO.md` is one
   conventional commit (`type(scope): subject`) that ticks its box. Never
   `--no-verify`. When a batch is done, `dev/<name>` is merged into
   `development` with `--no-ff`. A confirmed member pushes `development`
   and its own `dev/<name>` freely (Q2, answered 2026-11-15); `master`, tags,
   releases and repository settings are always asked for first.
   **The owner's edits** found in the working tree go first, as they are,
   one commit per change on `dev/Sarverott`, with a message saying how the
   agent understood them; then that branch is merged into `development`.
   Edits the owner makes on GitHub land on `development`; take them in with
   a fast-forward before branching.
   **Agents' own domain** is `docs/.agents/`: agents write there, humans
   read it and do not write, edit or delete.
3. **Tasks arrive as `// NOTE: ` comments** (in READMEs and Taskfiles too).
   Build what is concrete, keep the NOTE in place, add `ANSWER:` when the note
   asked a question, and report the notes you left with the question that
   blocks them.
4. **Gather politely, and let Sett start it.** The source is an open API.
   Requests carry the project's own User-Agent and run two at a time. Sett
   runs the gathering and the checkup; an agent verifies with tests and a
   local copy of the API, and does not run them against the real source
   unless asked. Hosts and interfaces (api, MCP, website, extension) only
   read `resources/`; none of them may start gathering.
5. **Nothing is sent to huggingface by an agent.** `resources/dataset`,
   `resources/space` and `resources/bucket` are filled locally; pushing and
   syncing them is Sett's move.

## Questions and plans

`docs/devlog/README.md` says how a batch moves. In short:

| It is | It goes to |
| ----- | ---------- |
| the owner's words | `docs/devlog/INQUIRIES.md` / `ORDERS.md` (or the chat), then `docs/changelog/phase-<n>.md`, word for word |
| a plan | `docs/devlog/VISION.md`, `ROADMAP.md`, `TODO.md` |
| a question for the owner | `docs/devlog/BRAINSTORM.md` as `## Q<n>. <title>` with a *Lean:*; never settled in code before the answer |
| an idea for debate | `docs/devlog/PROPOSALS.md` as `PP<n>` |
| an agent's findings and what was not verified | `docs/.agents/` (`NOTES.md`, `things-to-check.md`) |
| work for another repository | `~/__WORKSHOP/forge/NOTES-for-repositories.md`, never the other repository itself |

## Source

ELI API of Sejm, `https://api.sejm.gov.pl/eli` (OpenAPI under `/eli/openapi/`).
`GET /` names everything it gives, and the gatherer follows that index:

| Address | Gives | Kept in |
| --- | --- | --- |
| `/statuses` `/types` `/references` `/keywords` `/institutions` | lists | `dataset/lists/<name>.json` |
| `/acts` | journals with years: `DU` 97907 acts since 1918, `MP` 66730 since 1930 (2026-10-13) | `dataset/lists/publishers.json` |
| `/acts/DU/2026` | every act of the year in one answer | `dataset/acts/DU/2026.jsonl` |
| `/acts/DU/2026/1` | details | `bucket/DU/2026/<address>.json` |
| `/acts/DU/2026/1/references` | references to other acts | `bucket/DU/2026/<address>.references.json` |
| `/acts/DU/2026/1/text.pdf` | published PDF, when `textPDF` | `bucket/DU/2026/<address>.pdf` |
| `/acts/DU/2026/1/text.html` | HTML, when `textHTML` | `bucket/DU/2026/<address>.html` |
| `/acts/DU/2026/1/struct` | skeleton of text, when `textHTML` | `bucket/DU/2026/<address>.struct.json` |
| `/acts/DU/2026/1/text/U/<name>` | other texts named in details | `bucket/DU/2026/<address>.U.pdf` |
| `/changes/acts?since=` | acts changed since a day | taken again by `gather --since` |

Two more sources have their own directories (`docs/guides/sources.md`):
work of Sejm, `https://api.sejm.gov.pl/sejm`, in `resources/sejm-dataset`
and `resources/sejm-bucket`; court judgments of SAOS,
`https://www.saos.org.pl/api`, in `resources/saos-dataset`.

Websites that show the same acts to people are listed in
`resources/frontends.json`. They are visited only by `checkup`, with a
browser, one page at a time.

## Layout

```
src/core/              the gatherer itself; everything below is its tree
  main.ts              arguments; commands gather, seal, compile, text, sejm, saos, checkup, hub - usage is written there
  crawl.ts             one polite walk over addresses of an API, queue in memory
  apihandlers/         one file per source: addresses, shapes, and the walk when the source has its own
    eli.ts             addresses and shapes of ELI API
    sejm.ts            other source: processes and prints of Sejm
    saos.ts            other source: court judgments
  methods/             what a command does
    gather.ts          index -> lists -> years, then files of acts year by year; --since for changes
    seal.ts            checksums of gathered files: records, and check against them
    compile.ts         tables of details and references from raw files
    checkup.ts         browser (Camoufox) visits websites that show acts, writes what it saw
  parsing/             raw files into text
    text.ts            markdown from html, with checksums of both
  resources/           the local sides and their way to huggingface
    store.ts           where gathered things are written
    hub.ts             sync of resources/ with huggingface, file by file (@huggingface/hub)
  vars/                every type and interface, one per file, flat inside each directory
    interfaces/        <Name>.interface.ts, and index.ts with namespaces GatheringScope, HuggingfaceScope
    types/             <Name>.type.ts, and index.ts with the same namespaces
  reading/             gathered data as readers see it - the only thing hosts below lean on
    library.ts         journals, pages of acts, one act, its text, ties and files; reads resources/ only
src/openapi/           http api (/api, /openapi.json) with socket.io notices, serves dist/web too
src/mcp/               MCP server over stdio for AI agents, read-only
src/workflows/         durable runs (Workflow SDK on Nitro): flows/ daily.ts and steps.ts, server/api/ start and approve;
                       built from inside that directory; the run pushes only after a person answers "yes"
src/gui/               index.vue - the one viewer that every interface shows
src/web/               Astro website carrying the viewer (pages/), built into dist/web
src/desktop/           Electron window: starts the api, shows the viewer
src/app/               web app manifest and Capacitor config of the android app
src/firefox-ext/       browser extension (manifest v3, loads in Chrome too)
src/chrome-ext/        empty, kept
src/tui/               Sett's terminal interface experiment (TermUI), out of the checks until its packages are added
src/devtools/          tools of the repository itself: version.ts (one version: sync, bump per commit, merge driver)
src/Taskfile.yml       tasks of everything above core, included in the root one
src/README.md          every file of src/, what it does and why, with graphs - read it before changing src/
scripts/               install.sh, install.bat, the python push - scripts/README.md
tests/            vitest; gather.test.ts runs whole gathering against a local copy of API
resources/        .map.json lists huggingface repositories, their local sides are ignored by git
  dataset/        tables: lists/, and per <journal>/<year> acts, files, details, references, texts, checkups
  bucket/         raw files of acts: <journal>/<year>/<address>.{json,references.json,pdf,html,struct.json,U.pdf}
docs/guides/      how to install, gather, check up, move data, gather on a second machine; what it can do (features.md)
docs/mkdocs.yml   the website of the project (MkDocs Material, uv project in docs/), built into site/ - task docs:build
docs/_mkdocs/     its hook: the state on the home page from TODO.md and features.md
docs/glossary/    words of the source and of the project, each with one meaning
docs/.agents/     the agents' own domain (humans read only): NOTES.md (findings, newest on top), ideas.md, things-to-check.md (what waits for a decision
                  or was not verified - keep it current); point-of-view.md is personal
docs/devlog/      the BOS devlog: VISION, ROADMAP, TODO, BRAINSTORM, ORDERS, INQUIRIES, PROPOSALS, scrapnotes
docs/changelog/   what happened per phase, the owner's words word for word, append-only
.github/          paperwork: CONTRIBUTING, SECURITY, CODE_OF_CONDUCT, SUPPORT, forms of issues, AUTHORS;
                  bos.json (the loop as data), dependabot.yml, workflows/checks.yml
.obsidian/        the repository is an Obsidian vault; plugins/ holds separate repositories
```

Every directory with procedures has its own `Taskfile.yml` (`.husky`,
`.github`, `resources`), included in the root one.

## Commands

| Command | What it does |
| --- | --- |
| `task gather` | lists and metadata of the newest year, every journal |
| `task gather -- 2026 --acts --limit 5` | and all files of 5 acts that miss any |
| `task gather:everything` | all of it, asks before it starts |
| `task gather:changes` | acts changed since the previous such run |
| `task seal` / `task seal -- --check` | write checksums of files without a record / compare files with records |
| `task compile` / `task text` | tables from raw files / markdown from html |
| `task sejm -- 10 --files --limit 50` | processes and prints of a term of Sejm |
| `task saos -- 2025 --limit 3` | court judgments, 3 months that are not here |
| `task checkup -- 2026 --limit 6` | browser visits websites for acts of a gathered year |
| `task resources:plan -- dataset` | what differs between local side and huggingface |
| `task resources:pull -- dataset` / `push` | take what is missing here / send what is new here |
| `task version:sync` | every version field written from `package.json` (also done by each bump) |
| `task lint` / `task format` | Biome, check only / with fixes |
| `task serve` / `task mcp` | http api with the website on 127.0.0.1:8080 / MCP server over stdio, both read-only |
| `task workflows:build` / `workflows:serve` | durable runs on 127.0.0.1:8090 |
| `task workflows:daily` / `workflows:approve -- <token>` | one daily run that waits for you / your answer |
| `task docs:build` / `docs:serve` | the website of the project into `site/` / live preview |
| `task devlog:state` / `devlog:scrapnote` | where the project stands (the `bos` command) / a new scrapnote |
| `task web:build` / `task desktop` | website into `dist/web` / Electron window around it |
| `task check` (or `task verify`) | Biome, build (TypeScript and website), tests — the same in CI; run before a commit is reported done |

## Conventions

- Tabs for indentation (Biome), except `package.json`. Double quotes.
- Short file names. Data and addresses stay out of handlers.
- No flat scope: a new file goes into the directory of its kind under
  `src/core/` (or a new directory when it is a new kind), not next to
  `main.ts`. The same holds for docs, tests and resources as they grow.
- Types and interfaces are not declared next to code. Each has its own file
  in `src/core/vars/types/` or `src/core/vars/interfaces/` (default export,
  no directories inside), is added to a namespace in the `index.ts` there,
  and is used through it: `GatheringScope.Act`. Namespaces only in indexes.
- A gathered file appears under its name only when it is complete (`.part`
  first), so an interrupted run can be repeated and takes what is missing.
- What is gathered is known from files and from records in `dataset/files/`.
  Nothing is resumed from `storage/`; queues of requests live in memory.
- Names of files come from answers of APIs and are checked before use.
- Tests never touch the real API. `ELI_API`, `SEJM_API`, `SAOS_API` and
  `RESOURCES_DIR` in environment point the code at a copy.

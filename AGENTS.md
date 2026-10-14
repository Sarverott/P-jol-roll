# P_JOL_ROLL — guide for agents

Polish Journals of Laws resources operational lurker loader: gathers every act
published in Dziennik Ustaw and Monitor Polski, keeps tables as a dataset and
the raw files of every act in a bucket, to be parsed later.
The workshop-level rules in `~/__WORKSHOP/AGENTS.md` still apply.

Who you work with and how a session goes is written down in the portfolio
repository: `../Sarverott/AGENTS.md` and `../Sarverott/docs/agents/`.

## Rules

1. **Do not commit and do not push.** Sett reviews the working tree and writes
   every commit. Leave changes uncommitted and report what changed.
2. **Tasks arrive as `// NOTE: ` comments** (in READMEs and Taskfiles too).
   Build what is concrete, keep the NOTE in place, add `ANSWER:` when the note
   asked a question, and report the notes you left with the question that
   blocks them.
3. **Gather politely, and let Sett start it.** The source is an open API.
   Requests carry the project's own User-Agent and run two at a time. Sett
   runs the gathering and the checkup; an agent verifies with tests and a
   local copy of the API, and does not run them against the real source
   unless asked.
4. **Nothing is sent to huggingface by an agent.** `resources/dataset`,
   `resources/space` and `resources/bucket` are filled locally; pushing and
   syncing them is Sett's move.

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
  interfaces/          empty for now
src/cli-command.js, cli-repl.js, desktopapp/, webgui/, webserver/
                       Sett's beginnings of other ways in (terminal, Electron, Astro, express) - not wired yet
tests/            vitest; gather.test.ts runs whole gathering against a local copy of API
resources/        .map.json lists huggingface repositories, their local sides are ignored by git
  dataset/        tables: lists/, and per <journal>/<year> acts, files, details, references, texts, checkups
  bucket/         raw files of acts: <journal>/<year>/<address>.{json,references.json,pdf,html,struct.json,U.pdf}
docs/guides/      how to install, gather, check up, move data; what the data is
docs/glossary/    words of the source and of the project, each with one meaning
docs/agents/      notes written by agents: ideas.md, things-to-check.md (what waits for a decision
                  or was not verified - keep it current); point-of-view.md is personal
docs/devlog/      scrapnotes with the plan and progress
.github/          paperwork: CONTRIBUTING, SECURITY, CODE_OF_CONDUCT, SUPPORT, forms of issues
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
| `task check` / `task format` | Biome, check only / with fixes |
| `task verify` | check, build, tests — run before reporting work as done |

## Conventions

- Tabs for indentation (Biome), except `package.json`. Double quotes.
- Short file names. Data and addresses stay out of handlers.
- No flat scope: a new file goes into the directory of its kind under
  `src/core/` (or a new directory when it is a new kind), not next to
  `main.ts`. The same holds for docs, tests and resources as they grow.
- A gathered file appears under its name only when it is complete (`.part`
  first), so an interrupted run can be repeated and takes what is missing.
- What is gathered is known from files and from records in `dataset/files/`.
  Nothing is resumed from `storage/`; queues of requests live in memory.
- Names of files come from answers of APIs and are checked before use.
- Tests never touch the real API. `ELI_API`, `SEJM_API`, `SAOS_API` and
  `RESOURCES_DIR` in environment point the code at a copy.

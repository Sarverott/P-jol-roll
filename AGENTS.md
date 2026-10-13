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

Websites that show the same acts to people are listed in
`resources/frontends.json`. They are visited only by `checkup`, with a
browser, one page at a time.

## Layout

```
src/main.ts       arguments; commands gather, checkup, hub - usage is written there
src/eli.ts        addresses and shapes of ELI API
src/store.ts      where gathered things are written
src/gather.ts     index -> lists -> years -> files of acts (crawlee HttpCrawler)
src/checkup.ts    browser (Camoufox) visits websites that show acts, writes what it saw
src/hub.ts        sync of resources/ with huggingface, file by file (@huggingface/hub)
tests/            vitest; gather.test.ts runs whole gathering against a local copy of API
resources/        .map.json lists huggingface repositories, their local sides are ignored by git
  dataset/        tables: lists/, acts/<journal>/<year>.jsonl, checkups/<journal>/<year>.jsonl
  bucket/         raw files of acts: <journal>/<year>/<address>.{json,references.json,pdf,html}
docs/agents/      notes written by agents for agents; point-of-view.md is personal
docs/devlog/      scrapnotes with the plan and progress
.obsidian/        the repository is an Obsidian vault; plugins/ holds separate repositories
```

Every directory with procedures has its own `Taskfile.yml` (`.husky`,
`.github`, `resources`), included in the root one.

## Commands

| Command | What it does |
| --- | --- |
| `task gather` | lists and metadata of the newest year, every journal |
| `task gather -- 2026 --acts --limit 5` | and 4 files of 5 acts that miss any |
| `task gather:everything` | all of it, asks before it starts |
| `task checkup -- 2026 --limit 6` | browser visits websites for acts of a gathered year |
| `task resources:plan -- dataset` | what differs between local side and huggingface |
| `task resources:pull -- dataset` / `push` | take what is missing here / send what is new here |
| `task check` / `task format` | Biome, check only / with fixes |
| `task verify` | check, build, tests — run before reporting work as done |

## Conventions

- Tabs for indentation (Biome), except `package.json`. Double quotes.
- Short file names. Data and addresses stay out of handlers.
- A gathered file appears under its name only when it is complete (`.part`
  first), so an interrupted run can be repeated and takes what is missing.
- Tests never touch the real API. `ELI_API` and `RESOURCES_DIR` in
  environment point the code at a copy.

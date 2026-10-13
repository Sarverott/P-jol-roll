# P_JOL_ROLL — guide for agents

Polish Journals of Laws resources operational lurker loader: gathers every act
published in Dziennik Ustaw (and other journals of polish law), keeps the
metadata as a dataset and the raw PDFs in a bucket, to be parsed later.
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
3. **Gather politely.** The source is an open API. Requests carry the project's
   own User-Agent, run two at a time, and a run takes only what was asked for.
   Do not start a gathering of everything on your own.
4. **Nothing is sent to huggingface by an agent.** `resources/dataset`,
   `resources/space` and `resources/bucket` are filled locally; pushing and
   syncing them is Sett's move.

## Source

ELI API of Sejm, `https://api.sejm.gov.pl/eli` (OpenAPI under `/eli/openapi/`):

| Address | Gives |
| --- | --- |
| `/acts` | journals (`DU` Dziennik Ustaw, `MP` Monitor Polski) |
| `/acts/DU` | years of journal, 1918 until now, 97907 acts on 2026-10-13 |
| `/acts/DU/2026` | every act of the year in one answer |
| `/acts/DU/2026/1` | details: references to other acts, keywords, texts |
| `/acts/DU/2026/1/text.pdf` | the published PDF |

`dziennikustaw.gov.pl` holds the same PDFs, and its `robots.txt` disallows
everyone but Google, so it is not used.

## Layout

```
src/eli.ts        addresses and shapes of ELI API
src/store.ts      where gathered things are written
src/routes.ts     handlers: publisher -> year -> pdf
src/main.ts       arguments and crawler (crawlee HttpCrawler)
tests/            vitest
resources/        .map.json lists huggingface repositories, cloned here (ignored by git)
  dataset/acts/<journal>/<year>.jsonl      metadata, one act per line
  bucket/<journal>/<year>/<address>.pdf    raw texts
docs/devlog/      scrapnotes with the plan and progress
.obsidian/        the repository is an Obsidian vault; plugins/ holds separate repositories
```

Every directory with procedures has its own `Taskfile.yml` (`.husky`,
`.github`, `resources`), included in the root one.

## Commands

| Command | What it does |
| --- | --- |
| `task resources:clone` | clone dataset and space, needed before gathering |
| `task gather -- 2026` | metadata of the year (no year = the newest, `--all` = every) |
| `task gather -- 2026 --pdf --limit 5` | and 5 PDFs that are not gathered yet |
| `task check` / `task format` | Biome, check only / with fixes |
| `task verify` | check, build, tests — run before reporting work as done |

## Conventions

- Tabs for indentation (Biome), except `package.json`. Double quotes.
- Short file names. Data and addresses stay out of handlers.
- A gathered file appears under its name only when it is complete (`.part`
  first), so an interrupted run can be repeated and takes what is missing.

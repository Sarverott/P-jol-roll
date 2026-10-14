# Development

How to change the code. For how to propose a change, see
[CONTRIBUTING](../../.github/CONTRIBUTING.md).

## The code

| File | What is in it |
| --- | --- |
| `src/core/main.ts` | arguments and the commands. Usage is written at its top |
| `src/core/apihandlers/eli.ts` | the API: its address, shapes of answers, addresses of every part of an act |
| `src/core/resources/store.ts` | where gathered things are written, and how (`.part`, then rename) |
| `src/core/crawl.ts` | one polite walk over addresses of an API: own name, pace, queue in memory |
| `src/core/methods/gather.ts` | index → lists → years, then files of acts year by year; `--since` for changes |
| `src/core/methods/seal.ts` | checksums of gathered files: writing records, checking files against them |
| `src/core/methods/compile.ts` | tables of details and references from raw files |
| `src/core/parsing/text.ts` | markdown from HTML, with records that tie both |
| `src/core/apihandlers/sejm.ts` | another source: processes and prints of Sejm |
| `src/core/apihandlers/saos.ts` | another source: court judgments |
| `src/core/methods/checkup.ts` | the browser visiting websites, with Crawlee `PlaywrightCrawler` and Camoufox |
| `src/core/resources/hub.ts` | comparison and sync with Hugging Face, with `@huggingface/hub` |

Four rules keep it readable:

- **Addresses and data stay out of handlers.** A handler in `gather.ts` says
  what happens; where to ask is in `eli.ts` and where to write is in
  `store.ts`.
- **One command, one file.** `main.ts` only reads arguments and calls.
- **No flat scope.** Files sit in the directory of their kind under
  `src/core/`: `apihandlers/` for sources, `methods/` for what commands do,
  `parsing/` for raw files into text, `resources/` for the local sides and
  Hugging Face. A new kind gets a new directory.
- **Types and interfaces live in `src/core/vars/`.** One per file,
  `types/<Name>.type.ts` or `interfaces/<Name>.interface.ts`, with a default
  export and no directories inside. The `index.ts` of each directory puts
  them into namespaces, `GatheringScope` and `HuggingfaceScope`, and code
  takes them from there:

  ```ts
  import type { GatheringScope } from "../vars/interfaces/index.js";
  import type { GatheringScope as GatheringTypes } from "../vars/types/index.js";

  function trusted(act: GatheringScope.Act, part: GatheringTypes.Part) {}
  ```

`src/cli-command.js`, `src/cli-repl.js`, `src/desktopapp/`, `src/webgui/`
and `src/webserver/` are beginnings of other ways into the same core. They
are not wired to anything yet.

## Tasks

| Task | What it does |
| --- | --- |
| `task check` | Biome: lint and formatting, changes nothing |
| `task format` | Biome with safe fixes |
| `task build` | TypeScript into `dist/` |
| `task test` | tests, once |
| `task verify` | all three checks. Run it before reporting work as done |
| `task seal`, `compile`, `text` | work on gathered files, without the internet: see [processing](processing.md) |
| `task github:repo`, `runs`, `issues`, `prs` | read the state of the repository on GitHub with `gh` |

Every directory with procedures has its own `Taskfile.yml` (`.husky`,
`.github`, `resources`), included in the root one.

## Tests

Vitest, in `tests/`. They never touch the real API, the websites or Hugging
Face.

| File | What it checks |
| --- | --- |
| `eli.test.ts` | choice of journals and years, addresses, paths of files |
| `gather.test.ts` | whole gatherings against a local copy of the API: lists, order, limit, skipping what exists, records, structure and other texts, changes since a day; then tables, markdown and checksums made from the result |
| `sources.test.ts` | Sejm and judgments against local copies of their APIs |
| `checkup.test.ts` | how addresses of websites are filled in from an act |
| `hub.test.ts` | naming of repositories, and that only what differs is moved |

A test that needs the API starts a small server and points the code at it:

```ts
process.env.ELI_API = `http://localhost:${port}`;
process.env.RESOURCES_DIR = join(work, "resources");
process.env.CRAWLEE_STORAGE_DIR = join(work, "storage");
```

These must be set before the code is imported, because `eli.ts` and
`store.ts` read them once.

## Adding one more file per act

For example `struct`, which the API gives as `/acts/DU/2026/1/struct`:

1. `src/core/apihandlers/eli.ts`: add the name to `PARTS` and one line to `filesOf`, with
   the address it is asked at and the ending of its file name. If the file
   does not exist for every act, return nothing for the acts without it.
2. `tests/gather.test.ts`: let the local copy of the API answer for it.
3. `docs/guides/data.md`, `docs/guides/gathering.md` and the table in
   `AGENTS.md`.

`gather.ts` and `seal.ts` need no change: a file ending in `.json` is saved
as JSON, one ending in `.pdf` must be a PDF, and anything else is kept as
it came. This is how `struct` was added.

## Adding a website to checkup

One entry in `resources/frontends.json`. Read the website's `robots.txt`
first and write what it says into `title` when it disallows crawlers.

## Adding a source

Another API is one more file with its addresses, shapes and gathering, and
a command in `main.ts`; `sejm.ts` and `saos.ts` are the examples. `crawl.ts`
gives the polite walk, `store.ts` the writing of files, and `hub.ts` the
moving. Its directories are `resources/<source>-dataset` and
`resources/<source>-bucket`. Propose it first with the "new source"
issue form; candidates already looked at are in
[ideas](../agents/ideas.md).

## Style

Biome decides: tabs, double quotes, sorted imports. `package.json` keeps
spaces. `.obsidian/` is not checked. The pre-commit hook runs Biome on
staged files through `.husky/Taskfile.yml`.

Comments are short and say why. `// NOTE:` comments are tasks from the
maintainer, with `ANSWER:` lines as replies; both stay.

## What is stale

| File | State |
| --- | --- |
| `Dockerfile` | rewritten for what `src/` is now; the image was not built yet |
| `scripts/hf-push.py`, `scripts/Taskfile.yml` | kept; `task resources:push` does the same job file by file |
| `storage/` | queue of the first gatherer, hundreds of thousands of small files; nothing reads it now |

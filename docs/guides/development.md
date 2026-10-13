# Development

How to change the code. For how to propose a change, see
[CONTRIBUTING](../../.github/CONTRIBUTING.md).

## The code

| File | What is in it |
| --- | --- |
| `src/main.ts` | arguments and the three commands: `gather`, `checkup`, `hub`. Usage is written at its top |
| `src/eli.ts` | the API: its address, shapes of answers, addresses of every part of an act |
| `src/store.ts` | where gathered things are written, and how (`.part`, then rename) |
| `src/gather.ts` | index → lists → years → files of acts, with Crawlee `HttpCrawler` |
| `src/checkup.ts` | the browser visiting websites, with Crawlee `PlaywrightCrawler` and Camoufox |
| `src/hub.ts` | comparison and sync with Hugging Face, with `@huggingface/hub` |

Two rules keep it readable:

- **Addresses and data stay out of handlers.** A handler in `gather.ts` says
  what happens; where to ask is in `eli.ts` and where to write is in
  `store.ts`.
- **One command, one file.** `main.ts` only reads arguments and calls.

## Tasks

| Task | What it does |
| --- | --- |
| `task check` | Biome: lint and formatting, changes nothing |
| `task format` | Biome with safe fixes |
| `task build` | TypeScript into `dist/` |
| `task test` | tests, once |
| `task verify` | all three checks. Run it before reporting work as done |
| `task github:repo`, `runs`, `issues`, `prs` | read the state of the repository on GitHub with `gh` |

Every directory with procedures has its own `Taskfile.yml` (`.husky`,
`.github`, `resources`), included in the root one.

## Tests

Vitest, in `tests/`. They never touch the real API, the websites or Hugging
Face.

| File | What it checks |
| --- | --- |
| `eli.test.ts` | choice of journals and years, addresses, paths of files |
| `gather.test.ts` | a whole gathering against a local copy of the API: lists, order, limit, skipping what exists, trusting the flags |
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

1. `src/eli.ts`: add the name to `PARTS` and its suffix to `PART_SUFFIX`.
   If the file does not exist for every act, say so in `hasPart`.
2. `src/store.ts`: add its file suffix to `PART_SUFFIX` there.
3. `src/gather.ts`: the `part` handler saves JSON for `details` and
   `references` and bytes for the rest; add the new name to the right side.
4. `tests/gather.test.ts`: let the local copy of the API answer for it.
5. `docs/guides/data.md` and the table in `AGENTS.md`.

## Adding a website to checkup

One entry in `resources/frontends.json`. Read the website's `robots.txt`
first and write what it says into `title` when it disallows crawlers.

## Adding a source

Another API is another pair of files: its addresses and shapes (like
`eli.ts`) and its gathering (like `gather.ts`), with a command in `main.ts`.
`store.ts` and `hub.ts` are shared. Propose it first with the "new source"
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
| `Dockerfile` | from the first template; does not build what `src/` is now |
| `scripts/hf-push.py`, `scripts/Taskfile.yml` | replaced by `src/hub.ts` |

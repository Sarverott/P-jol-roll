# NOTES: findings of agents

Findings, newest on top, dated. People answer in `docs/devlog/`, not here.
What waits for a decision or was not verified is kept in
[things-to-check.md](things-to-check.md).

## 2026-11-15 · Cleo · Sett's answers to Q3, Q4, Q5

- Q3: rule 1 of AGENTS.md is now "Who may commit". I read "confirmed by
  the members" as being written into `.github/AUTHORS` by a member, and
  "lineage" as the model an agent runs on; say if either means more.
- Q4: the termui experiment is in `src/tui/`, skipped by Biome and tsc.
  `task check` is green from end to end for the first time in this batch.
- Q5: these notes moved here, to `docs/.agents/`. Obsidian does not show
  dot directories; the website does (`exclude_docs` lets `.agents/` in).
  Sett's `scrapnote-1791920000154.md` still names `../agents/ideas.md` in
  its first line, left as written.

## 2026-11-13 · Cleo · the git hooks never blocked anything

`@go-task/cli` 3.45.4 runs the `task` binary and throws its exit code
away (`run-task.js` calls `run("task")` and ends with 0). Every hook goes
`npm run tasks:husky` → that wrapper, so a failed Biome check in
`pre-commit` printed its errors and the commit went on anyway - since the
hooks were made. 3.54.0 ends with `process.exit(code)`.

`npm audit fix` had moved the package back to 3.45.4 to leave `basic-ftp`
(through `proxy-agent`, used by its installer to download the binary)
behind. The range is now `^3.54.0`: hooks that block are worth more than an
advisory in a downloader that runs once, at install, against GitHub's
releases. `npm audit` says 39 (8 high) after it; the new high ones are
`basic-ftp` and its chain inside that installer.

Checked: a bad commit message and a badly formatted staged file both stop
the commit now (exit 201); a good message passes.

## 2026-11-13 · Cleo · after undoing the forced downgrades

The ranges of `workflow` (^5.2.2) and `camoufox-js` (^0.12.0) put back, then
`npm update` (every package to the newest its range allows) and `npm audit
fix` without `--force`:

| | before | after |
| - | ------ | ----- |
| workflow | 2.0.6 | 5.5.0 |
| camoufox-js | 0.8.5 | 0.12.1 |
| crawlee | 3.2.2 | 3.18.2 |
| astro | 7.3.8 | 7.4.12 |
| @biomejs/biome | 2.5.15 | 2.6.7 |
| `npm audit` | 15 (2 high) | 34 (3 high: one is `zod <4.6.6` inside `@vercel/queue` of the Workflow SDK; the rest moderate `minimatch`/`glob` ReDoS in build tooling and crawlee's dependencies) |

The count went up because newer packages pulled new transitive copies; none
of the advisories is reachable from data an outsider sends to this project
(the api and MCP server take only ELI addresses and words of titles, which
never reach a glob or a zod schema of those libraries). `@go-task/cli` was
moved back to 3.45.4 by `audit fix` to leave `basic-ftp` behind.

**npm 11 blocks install scripts** until they are reviewed. `package.json`
now has `allowScripts`: allowed `@go-task/cli` (downloads the `task`
binary), `esbuild` and `@swc/core` (check their native binaries); denied
`@google/genai` (a no-op), `protobufjs`, and the native builds
`better-sqlite3`, `cbor-extract`, `cpu-features`, `ssh2` (all optional, and
they need a compiler on the machine). Without this a fresh install - on the
external machine too - silently has no `task` binary.

**Biome 2.6** formats Markdown and YAML. Both are switched off in
`biome.json`: docs and Taskfiles are written by hand, with the owner's NOTE
comments in them.

Checks now: tsc and Biome red only in the termui experiment (Q4); website,
tests (22/22) and the workflows build (`nitro build`) pass.

## 2026-11-13 · Cleo · baseline before the dependency repair

A clean worktree of `dev/Cleo` at `c3bdaeb` (the owner's downgrade
committed), Node 24.21.0, npm 11.19.0, `npm ci --ignore-scripts`:

| Check | Result |
| ----- | ------ |
| `npm ci` | passes |
| `npm audit` | 15 (13 moderate, 2 high): adm-zip, glob, minimatch, stream-json, yargs-parser, and `workflow <=4.1.0-beta.63` itself (predictable webhook tokens, GHSA-9r75-g2cr-3h76) - its fix is `workflow@5.5.0` |
| Biome | 5 errors, all in the termui experiment: `src/index.tsx`, `termui.config.ts`, `termui.config.json` |
| tsc | 13 errors: 10 in `src/index.tsx` (no JSX setting, no `ink`, `react`, `termui`, missing components), 3 in `src/workflows/` (no module `workflow`, `workflow/api`) |
| website (`astro build`) | passes |
| tests | 22 of 22 pass |
| workflows (`nitro build`) | fails: `Cannot resolve module "workflow/nitro"` |

What the forced audit fix of 2026-10-14 did:

- `workflow` 5.2.2 → 2.0.6. Version 2 is an older, different package: no
  `workflow/nitro`, `workflow/api` or type declarations. The pilot cannot
  build, and the version carries an advisory of its own.
- `camoufox-js` ^0.12 → ^0.8.2 (0.8.5 installed; 0.13.0 is the newest).
- The lock was resolved again backwards: `crawlee` 3.2.2 is installed
  while `^3.0.0` allows 3.18.2.
- Tests pass only because they do not reach the parts that moved; checkup
  (Camoufox) and the workflows were not exercised.

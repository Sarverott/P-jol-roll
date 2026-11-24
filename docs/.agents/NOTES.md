# NOTES: findings of agents

Findings, newest on top, dated. People answer in `docs/devlog/`, not here.
What waits for a decision or was not verified is kept in
[things-to-check.md](things-to-check.md).

## 2026-11-24 · Cleo · phase 36: the code of law analysed, a bubble, proposals

- The analysis needs no model: 165,006 acts, 750 thousand ties, 2 s. Of
  23,238 acts in force: 1,064 stand on a repealed basis, 2,678 refer to a
  repealed act, 153 wait for a consolidated text, 42 Tribunal judgments
  were followed by no amendment. Amending acts were most of the noise at
  first (their own references are spent) - left out.
- The text in the dataset is the act as published: the Banking Law of 1997
  spoke of state banks and a Minister of the State Treasury. The law in
  force is its newest consolidated text, an act of its own (here
  DU/2026/38): the bubble and the proposals read that one now.
- ministral-3:8b: good voices for the bubble, but an explainer instead of
  proposals; qwen3:8b followed the numbered findings, once each, after the
  task was said again at the end of the prompt and the basis limited to
  the findings or the text (it had invented "Dz. U. 2025 poz. 1234").
- A small model breaks its JSON with quotes inside a post: JSON mode of
  Ollama's /v1 asked for, and the fields read one by one when it still
  breaks.

## 2026-11-24 · Cleo · phase 34: the advanced strategy, the Python stack

- The weak answer is judged by what can be checked, not by a model: it
  said nothing, cited nothing, or cited an act it did not open. The checks
  of phase 31 show it would catch llama (three answers of five cite
  nothing) and deepseek-r1:8b's unread citations; it would not catch broken
  Polish - the team's translator does that.
- The large one gets the small one's answer as a draft to check, and its
  own first round (the nearest acts read) as every model does: the acts are
  read again through MCP (local, cheap), only tokens cost there.
- `mcp` 2.3 for Python differs from the 1.x of most examples (the almanac,
  models.md). It needs `httpx2`, so the stack uses that one http library.

## 2026-11-24 · Cleo · phase 31: six families asked the same five questions

`task mastermind:compare` on the RTX 3060 (12 GB), Ollama on the drive,
the five questions of `resources/configs/mastermind/questions.yaml`, the
same acts found by bge-m3 for each; 30 conversations in
`resources/conversations/`.

| Team | Models | A question | Acts cited (read) | What its answers were like |
| --- | --- | --- | --- | --- |
| gemma | gemma4:12b, functiongemma:270m, translategemma:4b, shieldgemma:2b | 65-150 s | 8 (6) | the closest to the text: the twelve virilists of DU/1918/2 named one by one; once "the acts do not answer" in English (the check of Polish then missed it - fixed); the slowest, four models taking turns on 12 GB; functiongemma called no tool in any round |
| deepseek | deepseek-r1:8b | 31-69 s | 10 (9) | broken Polish, words of no language |
| mistral | ministral-3:8b | 14-44 s | 11 (10) | fast, clear Polish with headings, citing what it read |
| qwen | qwen3:8b | 20-52 s | 13 (12) | fluent, cites articles (`art. 12`) |
| llama | llama3.1:8b | 8-46 s | 2 (2) | the fastest; three answers of five cite nothing |
| bielik | Bielik 11B v3.0 Q4_K_M | 16-57 s | 8 (6) | the most natural Polish; adds what it knows beyond the acts read (the Council dissolved on 7 October 1918 - true, but not from them) |

Not judged by a lawyer: read by Cleo against the acts given. For an answer
from the text, gemma's team; for Polish, Bielik; for speed with care,
ministral and qwen. embeddinggemma is pulled but no vectors of it are made
(`task embed` with `EMBED_MODEL=embeddinggemma:300m`, hours over every act),
so every team searched by bge-m3.

## 2026-11-22 · Cleo · phase 22: every function everywhere, a viewer that shines

- The map of functionalities (`docs/devlog/scrapnote-1795373814912.md`)
  found the terminals reading nothing, the launcher speaking in Taskfiles,
  half of the dataset shown nowhere and every way declaring its functions
  on its own. The patch is one catalog (`src/core/catalog/`) every way
  takes its functions from; `docs/guides/functions.md` is written from it
  and shows the holes left: mostly writing functions on hosts (Q19), and
  MCP without search and the map.
- Rule 4 and the owner's "every function in every interface" disagree for
  hosts: asked as Q19, nothing settled in code - the viewer shows writing
  functions disabled, as the owner asked for the space.
- The space's `Dockerfile` takes the release as a build argument; that a
  space's variables reach the build as arguments is from Hugging Face's
  documentation, not tried here (no token was used).
- In the remote mode the data tab knows only terms of Sejm and months of
  judgments already cached: the space reads directories, and the dataset
  has no index of them yet. Statistics reach the demo once `task stats`
  writes `dataset/statistics/acts.json` and the dataset is pushed.
- 186 new texts collected; the Polish of 28 corrected by me and marked
  `reviewed` in the pack (argostranslate had "play" as a game, "prints" as
  fingerprints, "plots" as plots of land); German and Ukrainian are machine
  work.
- `@mcp-b/global` pinned to 6.0.3 and p5 to 2.3.4, both older than two
  weeks. The first landed in the commit of "Terms of use" (the hook of
  versions staged `package.json` there), not in the one of WebMCP.
- My `pgrep -f "http.server 8193" | xargs kill` matched its own shell once
  more; only the preview server and that shell ended. Next time: by the
  pid of `ss -ltnp`.

## 2026-11-22 · Cleo · phase 21: the owner's notes across src

- The owner judged the code "not bad but could be better" and left notes
  in it. What they ask for, kept for the next code: imports on top of a
  Vue script (heavy parts by `defineAsyncComponent`, not `import()` in a
  function), named handlers above the code that wires them, one home per
  concern (colours, graph, socket, state), helpers shared not copied, data
  in yaml, small components. Each note is answered next to itself.
- The space was already pushed by the owner with phase 20's `Dockerfile`
  (image 0.17.0); the bucket had 12 files of its cache written before the
  rebuild, deleted. Nothing written there since.
- Biome's HTML support (`html.experimentalFullSupportEnabled`) formats and
  lints templates and styles of `.vue`, `.astro` and `.html`, but breaks
  some attributes that hold strings when it writes (almanac
  `biome-html-quotes`); and the Jinja of MkDocs is not HTML.
- Two api servers over the full dataset take every inotify watch of the
  user; `fs.watch` then fails silently and no notice is sent (almanac
  `inotify-watches`). My `pkill -f <pattern>` killed its own shell twice -
  nothing else; Sett's api (pid 3873288) stayed up.
- `task workflows:web` was run once without `--noBrowser` reaching it (the
  task dropped arguments), so it may have opened a browser tab on the
  owner's desktop around 17:14. Arguments reach it now.
- The viewer checked in headless Chromium (acts, an act, the map, a link
  `#act/DU/2026/2`, Polish); the desktop app by `task desktop:check`, with
  every window hidden; MCP over stdio, over `/mcp`, and the 2025 way by
  curl.

## 2026-11-22 · Cleo · phase 18: after v0.15.0, the almanac

- The release of v0.15.0 (run 45005803900) failed in the image build, in
  `tsc`: `.dockerignore` kept `resources/locales/` out. The owner read it as
  CodeQL stopping the container; CodeQL fails nothing, its alerts only
  appeared at the same time. Built here and served from the image.
- The owner's push (log-1795338475468) died at 1000 of 114433: Hugging Face
  refused `texts/MP/2025/WMP20250000029.md` as binary. 2205 texts held
  control characters from pdftotext (unmapped glyphs, mostly byte 3 on
  lines of their own). They are made again by the next `task text -- --pdf`,
  which reads each old text once to find them; push holds back any left.
- CodeQL: 15 alerts, one real flow - a journal `..` in the remote mode
  reached a local path and the address fetched from Hugging Face (writes
  stayed inside `resources/`, the host was fixed). The rest: same flow from
  `writeWhole()`, the extension's host as a link, the devtool's server, no
  rate limit, the npm cache of checks of `dev/dependabot`.
- The other logs of that run: `text` 114207 from PDF, 1428 scans, 2 damaged
  (DU/1932/38, DU/2007/189); `map` made `statutes` and `in-force`, the
  preset by meaning had 0 acts (no `task embed` yet); `seal` and `compile`
  had nothing new. No errors besides the push.
- The almanac follows BOS's `docs/almanac/` (its README's sections) and its
  `src/core/patterning.ts`; only cataclistics, solutions, patterning and
  rulesets are used here. 22 cases from the notes and changelogs.

## 2026-11-22 · Cleo · Q15, Q16: phases 15, 16, 17

- The owner's PDF run stopped on DU/1932/38 (zeros to its end, checksum as
  recorded): a damaged PDF is now listed with its error. Whether the source
  serves it so is in things-to-check.md.
- The demo already ran 0.11 (the owner pinned the Dockerfile); "updates not
  presented" was the space keeping app.py and the rest: push never deleted.
  `task resources:prune` and `task resources:space` are built, not run -
  they write to Hugging Face, which is the owner's.
- Translations: the owner's idea holds (tests on linkedom and jsdom, both
  pages and the docs in a browser). Traps met: Vite's glob skips dotfiles
  (.index.json imported by name); linkedom reports no characterData
  mutations (jsdom does, as browsers); argos transliterates letters in
  Ukrainian but never numbers, so names and identifiers stand in as
  numbers; a number in a template is filled with one digit, so SHA-256
  needed its own pattern. The packs are machine translations - not read by
  a person; Polish is the one the owner can review first.
- Embeddings: bge-m3 by `ollama serve` on the RTX 3060, DU 2020 only, in a
  scratch copy. Typesense here got those 2453 vectors (field added by PATCH)
  - a local test index, the owner's `task search:index` after `task embed`
  makes the real one. Ollama and Typesense were stopped afterwards.
- hyparquet reads snappy only without an extra package, so embed.py writes
  snappy.

## 2026-11-22 · Cleo · phases 12, 13, 14

- PDF texts: pdftotext keeps the two columns apart; most old PDFs are scans
  with Adobe Paper Capture's recognised text, kept uncorrected, the producer
  in the record. About 1 in 100 PDF-only acts has no text layer (sample of
  300). Some PDFs keep the producer as UTF-16 without its mark - repaired,
  the last letter of an odd length is lost. Not run over the whole bucket:
  tried on DU 1953 and MP 2021 in a copy, so the dataset is untouched.
  Q16 asks whether texts go packed a year in a file before any push.
- Media: the owner's first staged pointer of resources/mediafiles was the
  gist's empty first commit; committed the one with the graphics as a
  second change. Biome formatted the gist's .index.json and failed task
  check - the submodule is excluded now.
- Sigma 4 hides an edge by `visibility: "hidden"`, not `hidden: true`, and
  an 8-digit short hex colour renders wrong. The api of sigma for the
  position of a node: graphToViewport(graph.getNodeAttributes(node)).
- Maps were made in a scratch copy (symlinks to acts and references), not
  in resources/dataset/map/ - `task map` there is the owner's, as it goes to
  the dataset. Typesense was started here, filled from the local dataset
  (resources/.containerdatavol/typesense) and stopped.
- Mermaid adds about 6 MB of lazily loaded chunks to dist/web; they load
  only when an act has ties.

## 2026-11-22 · Cleo · after the merges, phase 11

- Logs: the owner's `hub push dataset` (log-1795316429823) crashed at 12800
  of 14170: Hugging Face takes 128 commits an hour per repository, the push
  made one per 100 files. Fixed (waits, retries; commits of 1000). The rest,
  1370 files, goes with the next push.
- Run 44977583906 (Dependabot, certifi on master) failed: master already
  has certifi 2026.11.20, there was nothing to update. Run 44977067595 (#26,
  uv-build) failed to land on a conflict in `scripts/uv.lock`; the owner's
  #27 landed it by hand. Nothing left to do.
- The demo space is RUNNING in the remote mode: journals, a year, an act
  and its text answer. It still holds `app.py` and `requirements.txt` of
  the marimo days - push never deletes, so removing them is the owner's.
- CodeQL (`codeql.yml`, the owner's) runs on master and pull requests to
  it; the repository is private, so code scanning needs GitHub Code
  Security there - not verified, its first run will tell.
- 125759 of 165006 acts have only a PDF: PP2. The owner's images: PP3.
  The posts for social media were not found on this machine.

## 2026-11-22 · Cleo · orders, phase 10

- Dependabot's first pull request (#18) failed in the merge job: it
  checked out `dev/dependabot`, made before the scripts existed. The jobs
  take scripts from `development` now, and #18 then went the whole way
  (merged, checked once, landed in development) by itself. Security
  updates ignore `target-branch` and open against master (#19-#22); the
  merge script turns them, but only once the workflow is on master - the
  four open ones were turned by hand through the API (`gh pr edit --base`
  said yes and changed nothing). Retargeting did not start the workflow;
  `@dependabot rebase` did.
- A pull request opened by the phase-close workflow (#23) gets its checks
  as "action required": runs started by GitHub Actions' own pull request
  wait for a person to approve them. Not approved by an agent.
- `lists/index.json` of the dataset is the index of the ELI API (addresses
  of its endpoints), not an index of the dataset. The demo's remote mode
  takes `lists/publishers.json` for years instead. On Hugging Face,
  `files/` reaches only some years and `texts/` some years too: without a
  record the demo guesses the files of an act from its listing.
- The launcher's Ctrl+C: under `task`, a raw terminal (the REPL's
  readline) turns Ctrl+C into a byte, and `script` copies that mode to the
  task's terminal. Cooked before the task, raw again after.
- `astro dev` (7.4) runs detached now: it prints `astro dev stop` and
  returns; `astro dev logs` shows its output.

## 2026-11-22 · Cleo · phase 9, the launcher, the services

- `gather:changes` broke on the API, not on us: `/changes/acts` answers
  400 to a bare day since about November 2026; it wants
  `yyyy-MM-ddTHH:mm:ss`. Seen by one request with the project's
  User-Agent. Crawlee only logged the failure and the run ended with 0;
  now such a run ends with 1.
- Logs of every run in `logs/`; a crash is logged before the exit.
- The first image on `ghcr.io` (v0.4.0) can be pulled without logging in.
- The launcher is plain `node:readline`; Sett's TermUI files are still out
  of the checks, the rest of `src/tui/` is in.
- A hook stopped a commit after the version was bumped; the bump now runs
  after Biome.
- Port 5353 is mDNS (avahi); internal-dns listens on 15353.

## 2026-11-22 · Cleo · phase 8, releases and routines

- Every workflow step is a script of `scripts/devops/` (shellcheck and
  actionlint clean). Tried against a scratch bare remote: `flow:land`,
  `flow:sync`, `release/hotfix.sh`. Not tried, because they need GitHub:
  `release.sh`, `readthedocs.sh`, the push to `github-pages`, the automerge
  and `phase-close.yml` - they run first on the next merge into `master`.
- Phases 0-3 closed together by hand on `development` (v0.1.0, PR #13),
  since `phase-close.yml` is not on `master` yet; phase 8 closes the same
  way.
- `webpage/`: React at the root of the website, MkDocs under `docs/`.
- The first `flow:land` wrote its summary in quotes; fixed.

## 2026-11-21 · Cleo · after the gathering break: answers to Q1, Q6-Q10

- **Versions.** One version in `package.json`, every copy synced
  (`src/devtools/version.ts`); each commit on `dev/*` bumps the patch, the
  merge driver keeps the higher. 0.0.1 → 0.0.14 in this batch.
- **Dependencies.** `npm audit`: 39 (8 high) → 0. Taken: every Dependabot
  update but `playwright` 1.65 (camoufox-js 0.13 wants `playwright-core`
  below 1.63) and `@types/node` 26 (Node 24 here). `crawlee` itself was
  still 3.2.2 under `^3.0.0`; now 3.18.2. Overrides: `basic-ftp`, `zod`,
  `glob`, `minimatch` (PP1). The Docker image moved to the browser of
  playwright 1.62.1.
- **Publishing.** Read the Docs syncs the website's tools from
  `docs/uv.lock` (tried in a fresh venv); `pages.yml` pushes `site/` from
  `master` to `github-pages` (the orphan commit tried in a scratch clone).
- **Services.** `compose.yaml` includes `resources/services/*.yaml`;
  `webapp-server` sends its logs to `log-collector` (rsyslog, tried with a
  test container).
- **Parrot OS.** `task unittesting:parrot-os`: Parrot Security 7.4, tsc and
  the gathering test pass. The external-drive trouble is not reproduced yet.

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

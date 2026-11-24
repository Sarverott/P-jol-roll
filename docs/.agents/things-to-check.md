# Things to check

Kept by Cleo. What waits for Sett's decision, and what was written and not
verified. A point leaves this page when it is settled. Dates say when the
point was added.

## Decisions for Sett

- **2026-11-24. The 30 conversations of the first comparison (phase 31)
  are not pushed.** `resources/conversations/` holds them; only the first
  one went to `Apokryf/Consiliariis-Polonicum-Lex`, as Sett asked. Sending
  the rest is Sett's `task resources:push -- conversations`.
- **2026-11-24. `/usr/share/ollama/.ollama/models` (4.4 GB)** of an old
  system service, not active, is left as it was - Sett's to keep or delete.
- **2026-11-24. The mastermind's compose run (phase 30) was not started
  here.** The image was run against the host's Ollama and answered
  `/api/ask`; `docker compose --profile mastermind config` is valid with and
  without `gpu.yaml`. Its own Ollama, `llms-models` pulling about 6 GB and
  the GPU through the NVIDIA Container Toolkit wait for the first machine
  that runs `task mastermind:up`.
- **2026-11-24. deepseek-r1:8b is a small voice.** It answers from the
  acts it was given, but now and then in English, with a word of another
  script, or citing an act it did not open (marked not read). A larger
  model is one variable away (`MASTERMIND_MODEL`); 12 GB of the RTX 3060
  hold a 14b only with a short context.
- **2026-11-24. The phases ahead (29-38, VISION)** are planned from Sett's
  own words (Q17, Q18, PP4, the milestones), not ordered: each starts when
  Sett says so. Phase 29 (deepseek-R1 and the embedder in Ollama, answering
  with the acts it read) is the next by the plan.
- **2026-11-24. The language packs are a submodule** (their gist). A clone
  without `git submodule update --init resources/locales` (`task
  i18n:pull`) does not build. A pack changed here reaches everyone only
  after `task i18n:publish`.
- **2026-11-24. The wiki is overwritten by `task docs:wiki`** (the pages
  `Devlog*`, `Almanac*`, `_Sidebar`, and Home between its two markers).
  Sett's own pages and `_Footer` are kept; a page written by hand under one
  of those names is lost with the next copy.
- **2026-11-22. The gate and the space, after the first whole loop (#42).**
  The gate passed and merged #42 by itself; the release brought the space to
  v0.24.2 and waited for it. Three things are still open. (1) The space's
  trusted publisher gave a token, but Hugging Face refused it for setting
  the variable, so `HF_TOKEN` did the rest - maybe the publisher's claims
  (workflow `release.yml`, branch `master`?) or a token that may only push;
  until that is clear, `HF_TOKEN` must stay. (2) Copilot did not answer the
  three `@copilot` requests the workflow's bot wrote on #42: Jarvis takes
  them from a person, it seems. (3) Snyk fails the gate on high findings
  only (Sett's choice); 16 medium and low ones wait in the Security tab.
- **2026-11-22. Jobs of writing functions (Q19, phase 25)** were tested
  with `stats` on a copy of resources (tests/writing.test.ts), not with a
  gathering against the source nor a push - those are Sett's to try, from
  the desktop app or `task serve -- --allow-writing`. A job runs its task
  with `--yes`: the viewer's dialog is the only yes the task's own prompt
  gets.
- **2026-11-22. The space's refresh needs the secret `HF_TOKEN`** in the
  repository (a token that may write to the space; settings are Sett's).
  Without it the release job says so and the space keeps what it has. The
  space's `Dockerfile` changes once more (`task resources:space`, then
  `task resources:push -- space`): from then on releases only set its
  variable. Not verified against Hugging Face: that a variable reaches the
  build as an argument is from their documentation of Docker spaces.
- **2026-11-22. The new words of the viewer** ("first", "last", "page {0}
  of {1}", the footer, the act's tab...) were collected and translated by
  argostranslate (phase 21); machine work, not read by a person.
- **2026-11-22. MCP of the space.** `/mcp` comes to the demo with the next
  image (a release) and its refresh.
- **2026-11-22. The new words of phase 22** (the data tab, plots,
  statistics, settings, the catalog): German and Ukrainian are
  argostranslate's, not read by a person; Polish of the short words was
  corrected by Cleo and marked `reviewed`.
- **2026-11-22. The demo's data tab and statistics.** The space lists
  terms of Sejm and months of judgments only once cached (no index of them
  in the dataset yet); statistics need `task stats` and a push of the
  dataset. WebMCP was registered in a headless browser, not yet called by
  a real agent.

- **2026-11-22. The demo space, in this order.** (1) The next release
  pushes `ghcr.io/sarverott/p-jol-roll-webapp-server`; a new package on
  ghcr.io is private, so make it public once (the package's settings,
  "Change visibility"), or Hugging Face cannot pull it. (2) In
  `resources/space` the marimo files are removed and the new `Dockerfile`
  and `README.md` wait, not committed: look, commit and push them to the
  space.

- **2026-11-22. Dependabot on `dev/dependabot`** acts once `dependabot.yml`
  reaches `master` (Dependabot reads it there). Until then its pull
  requests still aim at `development`. The branch `dev/dependabot` was made
  from `development` and pushed.

- **2026-11-21. Dependabot's #6 (`@types/node` 26)** is not taken: the
  project runs on Node 24. Closing it, or an `ignore` for majors of
  `@types/node` in `dependabot.yml`, is yours.
- **2026-11-21. Coolify and `include`.** `compose.yaml` now only includes
  the files of `resources/services/`. Whether Coolify follows `include`
  was not tried.
- **2026-11-21. Logs written as root.** `log-collector` writes
  `resources/.containerdatavol/log-collector/` as root; removing them
  needs `sudo` or a container.

- **2026-11-22. Once each, for the release workflow (phase 8).** Pages has
  to serve the `github-pages` branch (Settings, Pages, "Deploy from a
  branch", `github-pages`, `/`); `release.yml` fills it on every push to
  `master`. Read the Docs has to have the project `lex-polonica` on this
  repository; with a secret `READTHEDOCS_API_TOKEN` the release also
  activates each tag there. `phase-close.yml` can be started only once it
  is on `master` (GitHub's rule for `workflow_dispatch`).
- **2026-11-13. Dependabot is active only on `master`.** It reads
  `.github/dependabot.yml` from the default branch, so the config waits
  until `development` reaches `master` through your pull request.

- **2026-10-13. Labels on GitHub.** Issue forms use the labels `data` and
  `source`, which do not exist yet. Until they do, those issues arrive
  without a label. `gh label create data` and `gh label create source`.
- **2026-10-13. Private reporting of vulnerabilities** is off for the
  repository, so `SECURITY.md` gives `sett@sarverott.com`, taken from
  gitrecon.
- **2026-11-15. Six questions** wait in `docs/devlog/BRAINSTORM.md`
  (Q1, Q6-Q10; Q2-Q5 answered). Five TODO items wait on them: Parrot OS
  (Q1), publishing the website (Q6), the place in the workshop (Q7),
  versions (Q8), the Workflow SDK (Q9).
- **2026-11-13. Branches for outside contributors.** The BOS loop is in
  use: `development`, `dev/Sarverott`, `dev/Cleo`, pushed by their members
  (Q2). `CONTRIBUTING.md` still tells outside contributors to branch from
  `master` and open pull requests there; should they target `development`?
- **2026-10-13. The `journal` website in checkup.** `robots.txt` of
  `dziennikustaw.gov.pl` disallows every crawler but Google. The entry is in
  `resources/frontends.json`; removing it leaves that site alone.
- **2026-10-13. SAOS is not a server of the state.** It is a collection of
  published judgments with an API. Who runs it today and whether its data
  may be republished was not checked. Decide before pushing
  `resources/saos-dataset` anywhere. (2026-11-22: it is
  `resources/dataset/SAOS` now, inside the dataset - `resources:push --
  dataset` sends it once something is gathered; nothing is gathered here.)
- ~~**2026-10-13. New repositories on Hugging Face.**~~ Not needed: every
  source lives in the one dataset and bucket since phase 10.
- **2026-10-13. `storage/`.** The first gatherer left more than 500 thousand
  small files there. Nothing reads them now. `rm -rf storage` frees them.
- **2026-10-13. `scripts/`.** `hf-push.py` and its Taskfile are kept, with
  the path fixed. `task resources:push` does the same job file by file. Keep
  or remove.
- **2026-10-14. The api is open to every origin.** `src/openapi` answers
  any website, because the data is public and the extension and the app
  ask from elsewhere. It listens on this machine only unless `HOST` says
  otherwise; `compose.yaml` says `0.0.0.0`. There is no limit of requests
  per client yet. Decide before it stands on the internet.
- **2026-10-14. Capacitor is not installed.** `src/app/capacitor.config.json`
  is ready, and `task app:sync -- add android` fetches the command line by
  `npx`, but the app also needs `@capacitor/core` and `@capacitor/android`
  in `package.json` and the Android SDK on the machine. Left to you,
  because it adds a native project under `src/app/android`.
- **2026-10-14. Two new development dependencies**: `@astrojs/vue` (Vue
  inside Astro) and `@types/express`. `tsconfig.json` got `ES2022` in
  `lib`, because the MCP library needs `ErrorOptions`.
- **2026-10-14. `src/chrome-ext/`** stays empty. The extension in
  `src/firefox-ext/` loads in Chrome too; a separate one is needed only
  when the stores want different packages.
- **2026-10-14. Workflow SDK pilot.** Nitro 3 is a beta, and `workflow`
  5.2.2 came out the day before it was added. `npm audit` names 13 "high"
  advisories, all one: an old `nanoid` inside `@workflow/core` that loops on
  a negative size; the fix it offers is a downgrade to `workflow` 2. The
  local world keeps runs in `.workflow-data` and is meant for development;
  long self-hosted use points to `@workflow/world-postgres`. No schedule
  yet: a run starts by `task workflows:daily` (or cron calling it).
- **2026-10-14. `tsconfig.json`** got `skipLibCheck`, because types inside
  the Workflow SDK and Nitro do not check against ours.
- **2026-10-13. gitrecon.** Its `CODE_OF_CONDUCT.md` says it covers "every
  repository of the Shakespeare project". Not touched from here.

## Written and not verified

- **2026-11-22. The bots' flow (phase 19) runs first when it reaches
  master.** `bots.yml` (pull_request_target) and `bots-land.yml`
  (workflow_run) act only from master's copy. Tried: shellcheck and
  actionlint; not tried: a real run. The first Dependabot or Jarvis pull
  request after the merge will show it - `task github:runs`. Copilot's own
  login may differ from `Copilot`; the branch names `copilot/*` and
  `dev/Copilot*` catch it anyway.
- **2026-11-22. The rate limit in the demo** (600 a minute per address,
  `TRUST_PROXY=1`): tried here against the api, not behind the space's
  proxy. If every visitor of the space gets 429 together, the proxy is not
  one hop and `TRUST_PROXY` wants its number of hops.
- **2026-11-22. The almanac's issues are not opened.** `task almanac:issues:open
  -- all` makes 22 issues with `gh` and closes the solved ones at once; it
  was not run, as it writes to GitHub.

- **The website's diagrams.** Mermaid did not render in a headless
  browser (Material loads it from a CDN); the rest of the site did.
- **`dotenv` in the root Taskfile** was tried in a scratch Taskfile and by
  the tests; not on the second machine.

- **`hub push` and `hub pull`** were never run against Hugging Face. Only
  `plan` was.
- **The Docker image** was not built. The `Dockerfile` assumes the browser
  that comes in the base image is the one `camoufox-js` finds.
- **`checkup`** ran only against a local page. Addresses in
  `resources/frontends.json` come from single requests; the links inside
  Sejm's own answers (`isap`, `eli`) have the same shape.
- **`gather --since`, `struct`, `texts`, `sejm`, `saos`** ran only against
  local copies of the APIs. The shapes of the real answers were looked at
  with one request each.
- **`seal`, `compile`, `text`** ran over the real files gathered until
  2026-10-13 (34,482 files, years 1918 to 1933), writing into a scratch
  directory. They were not run into `resources/dataset`.
- **Markdown** was looked at only for acts of 1918 to 1933. Newer HTML and
  tables were not seen.
- **Paging of changes and of processes** assumes a page smaller than asked
  is the last one. 500 per page was not tried on the real APIs; 1000
  processes in one answer was.

- **The Electron window** was not opened: its binary is not downloaded
  (`node node_modules/electron/install.js` does it), and a window on your
  screen at night was not mine to open. Its script passes a syntax check.
  2026-10-14: Sett opened it; the second start found the port taken,
  because the api outlived the window (npx -> tsx -> node, only npx was
  killed). Now it is one process on a free port that ends when its stdin
  closes. Checked by killing the parent hard; the window itself again not.
- **The extension** was not loaded in a browser. Reading citations from
  addresses and text was checked on seven examples.
- **The website and the api** were checked in headless Camoufox over the
  real listings: list of 2026, opening an act, its PDF link, no errors.
  Markdown in the viewer was seen only in tests, because `task text` was
  never run into `resources/dataset`.
- **The MCP server** was asked over stdio: start, list of tools,
  `search_acts`, `act_text`. Not added to any agent.
- **`compose.yaml`, `install.sh`, `install.bat`** were not run. `install.sh`
  passes `sh -n`.

- **The workflow server** ran over a local copy of the ELI API and a
  scratch `resources/`: all four steps, a wrong token (404), "no" (run
  completed, nothing pushed), and no answer in 5 seconds (completed, by
  "nobody in time"). `hub plan` and `hub push` steps were not run, and
  nothing was run against the real API or Hugging Face.

## Assumptions in the docs

- **Text types.** `O` is the published PDF (one act compared byte for byte).
  That `U` is "tekst ujednolicony" and `T` is "tekst aktu" is read from
  file names.
- **Dates in listings.** That `announcementDate` is the date of the act and
  `promulgation` the date of publication is how the data reads.
- **Copyright.** That normative acts are outside copyright is article 4 of
  the act of 1994, as I recall it. The terms of the API were not found
  written anywhere.
- **A published PDF never changes**, so `gather --since` does not take it
  again.
- **Requests for everything**: about 572 thousand plus the other texts,
  from counts in listings on 2026-10-13. Size on disk is unknown; sixteen
  years took 10 GB.

## Limits known and left

- A month of judgments that is here is not asked for again, so judgments
  added later to an old month are missed.
- A file with a record counts as gathered even when it is nowhere. Deleting
  a file to take it again needs its record deleted too.
- `hub` still compares a bucket by path and size. Records make it possible
  to check files here, and they do not check what is on Hugging Face.

## Damaged PDFs in the bucket (2026-11-22, Cleo)

`DU/1932/WDU19320060038.pdf` ends in zeros from some point on; its record in
`dataset/files/` has the same checksum, so it was written as it arrived. Is the
source serving it like that, or did the download break? Only the owner asks the
source. The owner's full run found a second one, `DU/2007/189`, with the same
complaint ("Couldn't find trailer dictionary"). `task text -- --pdf` names every such PDF in `texts/<journal>/<year>.scans.jsonl`
with an `error`; `grep -h '"error"' resources/dataset/texts/*/*.scans.jsonl` lists them.

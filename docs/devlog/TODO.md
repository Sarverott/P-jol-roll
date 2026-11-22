# TODO

What is being worked on now. The idea of every phase: [VISION.md](VISION.md);
versions: [ROADMAP.md](ROADMAP.md); questions: [BRAINSTORM.md](BRAINSTORM.md);
history: [../changelog/](../changelog/phase-0.md).

Every item is one commit on `dev/Cleo` (or `dev/Sarverott` for the owner's
edits), ticking its box. An item waiting for an answer names its `Q<n>`.

## Phase 0: clear the ground

- [x] Branch `development` from `master`; the owner's uncommitted dependency edit committed on `dev/Sarverott` and merged
- [x] Devlog in the standard look of BOS: README, VISION, ROADMAP, TODO, BRAINSTORM, PROPOSALS, ORDERS, INQUIRIES, Taskfile; the inquiry of 2026-11-13 word for word in `docs/changelog/phase-0.md`
- [x] AGENTS.md: the craft loop and the routine of BOS in place of "do not commit" (Q2, Q3 for pushing)
- [x] The owner's answers to Q3, Q4, Q5 moved word for word into the changelog (`phase-0.md`, `phase-1.md`)
- [x] Pushing: members push `development` and their own `dev/<name>` freely, in AGENTS.md (Q2)
- [x] AGENTS.md: who may commit - identity and understanding confirmed by the members, own name and lineage in the co-authorship line, where edits go (Q3)
- [x] Agents' notes in `docs/.agents/`, their own domain that humans read (Q5)

## Phase 1: dependencies repaired

- [x] Baseline recorded in `docs/.agents/NOTES.md`: what install, check, build and tests give before any repair
- [x] Forced downgrades undone: `crawlee`, `camoufox-js` and the rest resolved by their ranges again, the lock regenerated from them, not by `audit fix --force`
- [x] Workflow SDK pilot on a version that builds: `workflow` 5.7.1, Nitro build passes, the `nanoid` advisory gone with the update (Q9)
- [x] Dependabot's pull requests gone through: all taken but `playwright` 1.65 (camoufox-js 0.13 wants `playwright-core` below 1.63, so 1.62.1) and `@types/node` 26 (Node 24 here, its types stay 24) (Q9)
- [x] `npm audit` brought down from 39 (8 high) to 0: crawlee 3.18.2, overrides for `basic-ftp`, `zod`, `glob`, `minimatch`; no replacement needed (PP1) (Q9)
- [x] The termui experiment placed so that checks pass: `src/tui/`, skipped by Biome and tsc (Q4)
- [x] Node pinned: `engines`, `.nvmrc`; `npm ci` from a clean copy passes
- [x] `.github/dependabot.yml`: npm and Actions, grouped, into `development`
- [x] `.github/workflows/checks.yml`: the same `task verify` as the hooks (green again once the termui experiment moved out of the checks, Q4)
- [x] Commit messages checked: commitlint and a `commit-msg` hook, like the BOS core
- [x] Hooks that block: `@go-task/cli` 3.54, whose wrapper passes the exit code of `task` on (3.45.4 threw it away)

## Phase 2: say what it can do

- [x] `docs/guides/features.md`: every function - works (and how it was verified), built and not verified, wanted
- [x] `README.md` rewritten: what it is, getting started in five commands, where to read on

## Phase 3: BOS integration

- [x] `.github/bos.json`: the loop (stations, contributors `dev/*`) and versioning, as in the BOS core
- [x] Taskfiles: `task check` (= CI) runs everything, `task lint` is Biome alone, `verify` kept as its old name; `devlog:` included
- [x] Anatomy checked against `bos-skillset`'s `bos-project` skill and the core's project template: all of it present; added `.github/AUTHORS` (`bos project authors`) and `task devlog:state` (`bos devlog state`)
- [x] One version: every version field (api, MCP, extension, Python projects) synced from `package.json` by `task version:sync` (Q8)
- [x] Every commit on `dev/*` bumps the patch in the pre-commit hook, with the merge driver that keeps the higher version, as in the BOS core (Q8)
- [x] Notes for the BOS repositories in `forge/NOTES-for-repositories.md` (outside git): `@go-task/cli` 3.54, npm 11 `allowScripts`, Biome 2.6, an eval case for the Dependabot skill
- ~~[ ] The project's place in the workshop: stays, with an optional relative scope (Q7, Q11)~~ - delegated to be resolved in core BOS repository project, here we work as in one of projects inside scope of "Sarverott's github repositories", repo cares only about own self, scope is topic related to way how workshop and forge works

## Phase 4: a website of the project

- [x] MkDocs Material over `docs/` (as the BOS core): the idea, the state, guides, glossary, devlog
- [x] The state on the home page, counted at build from `TODO.md` and `features.md`, so it never says more than they do
- [x] Read the Docs builds the documentation with the locked tools of `docs/` (Q6)
- [x] `site/` from `master` pushed to the `github-pages` branch by a workflow, as in Amoorion (Q6)
- ~~[ ] A static build of the explorer reading the dataset and the bucket on Hugging Face, into `resources/space/webapp` (Q6)~~ - done by the demo of phase 10: the project's own server, in a mode that reads the dataset prepared on Hugging Face and links the bucket, instead of a separate static build
- [x] Links in `.github/README.md`: introduction, demo, bucket, dataset, the podcasts in 12 languages, documentation, code, the repository seen by other tools (Q12)

## Phase 5: gathering on another machine

- [x] Guide: the gatherer on a second machine - clone on the internal disk, resources on the drive through `.env` (read by every task now), what refuses and why, both ways home (Q10 picks one)
- [x] Rich logging: every command writes structured lines to stdout and, when asked, to syslog (Q1)
- [x] A test container for Parrot OS: `tests/unittesting/parrot-os/headless-server/` with the case `-gather-and-parse`, against a local copy of the API (Q1)
- [x] The Parrot OS trouble with the bare repository on an external drive, reproduced in that container and solved: case `-bare-repo-on-drive` - npm `EPERM`, `Permission denied`, dubious ownership on the drive; the guide's layout works (Q1)

## Phase 6: services

The NOTEs Sett left in `compose.yaml` (changelog phase 6), each moved to its place.

- [x] `compose.yaml` includes one file per service from `resources/services/`; `web` renamed `webapp-server`
- [x] Directories with their ignore rules: `resources/configs/<purpose>/`, `resources/.containerdatavol/<volume>/`, `resources/secrets/`
- [x] `.env.example`; tokens left empty (after trimming) turn their optional functions off
- [x] `log-collector`: rsyslog, taking the logs of every service (Q1)
- [x] `docs-server`: the documentation served locally (nginx over `site/` of `pages/build.sh`, port 8000)
- [x] `gatherer-daemon` and `parser-daemon`: gathering and parsing as separate units, started by a person (profile `gathering`, `docker compose run`)
- [x] `routing-proxy` (traefik) and `internal-dns` (dnsmasq), for local use with the desktop window (profile `local-network`: `webapp.`, `docs.`, `demo.p-jol-roll.localhost`, and `.internal` through dnsmasq on 15353)
- [x] `hf-demo-space`: the demo space run here - the published `webapp-server` image taking the dataset, port 7860 (profile `demo`; the space itself took this way instead of the static explorer)
- [x] `llms-api-host`: ollama behind a litellm proxy (profile `llms`, port 4000, its key generated by `task init`)
- [x] `agentic-shell`: a shell for agents next to the host - the repository at /workspace, the project's tools, no port, no Docker socket, no root; `task shell` (Q13, the owner's reasoning in changelog phase 6)
- ~~[ ] `hf-gateway`: WireGuard connections towards Hugging Face (optional) (Q14)~~ - left for M5, the network without a centre (Q14, changelog phase 6)

## Phase 7: init and launcher

- [x] `task init`: checks what is installed, generates secrets, copies `.env.example`, once
- [x] `task help` lists the tasks (bare `task` runs it until the launcher exists)
- [x] Bare `task` starts the launcher
- [x] The launcher: a terminal menu in `src/tui/` over commands declared in `src/cli/`

## Phase 8: releases and routines

The inquiry of 2026-11-22 (changelog phase 8). Workflows run scripts of `scripts/devops/`, never multi-line blocks.

- [x] `README.md` is the page GitHub shows again: the links move there, `.github/README.md` goes; third-party references under a **DISCLAIMER:** quote; ExplainGitHub and GitReverse kept only in a scrapnote
- [x] `scripts/devops/`: the scripts of every workflow, one `.sh` each, with a common part and shellcheck in CI
- [x] Release on every push to `master`: checks, tag `v<version>` and the GitHub release - before the documentation and the website
- [x] After the release, in order: Read the Docs builds the tag, the website is built and pushed to `github-pages`, `master` goes back into `development`
- [x] Closing a phase: a workflow bumps Y (`vX.Y.Z`), pushes it to `development` and opens the pull request to `master`
- [x] Pull requests from `dev/*` into `development` merged by a workflow once checks pass
- [x] Local routines as tasks: `task flow:land` (dev/<name> into development, both pushed), `task flow:sync` (origin, master merged in, dev/<name> brought up), `task flow:phase-close`; the owner's edits stay with an agent, who has to say how it understood them
- [x] `webpage/`: a React page, the introduction at the root of the website, with the MkDocs site under `docs/`

## Phase 9: logs, the demo space, Dependabot's branch

The inquiry of 2026-11-22, the second (changelog phase 9). The launcher goes on in phase 7, the services in phase 6.

- [x] Dependabot's pull requests into `dev/dependabot`, merged there without checks; `dev/dependabot` checked once and landed in `development`
- [x] `task gather:changes` repaired: the API takes `since` only as `yyyy-MM-ddTHH:mm:ss`; a run whose requests fail ends with 1
- [x] Every run writes `logs/log-<Date.now()>-<log mode>-<command>.log` (`LOG_DIR`, `LOG_LEVEL` in `.env` and `.env.example`); a crash lands there too
- [x] `hub pull` takes files 8 at a time (`--parallel`), with progress every 500 - the dataset holds about 40 thousand texts
- [x] The container of `webapp-server` built and published to `ghcr.io` by the release workflow
- [x] The demo space on Hugging Face: the marimo example replaced by a Docker space running that container over the dataset (prepared in `resources/space`, pushed by the owner)

## Phase 10: one bucket, one dataset, a lighter demo, examples

The inquiries of 2026-11-22, the third (changelog phase 10).

- [x] The launcher keeps a log too: its file in `logs/` with the output of every task it runs; Ctrl+C stops the task and goes back to the menu, written in the log
- [x] `web:dev` stops watching `resources/` (it ran out of file watchers on the bucket)
- [x] One bucket: the raw files of every source in `resources/bucket/` (`DU/`, `MP/`, `sejm/`, `SAOS/`), with a README of links; one dataset: the tables of every source in `resources/dataset/`, the training collection; a task moving what is gathered into the new places
- [x] The demo reads the prepared dataset: the server in a remote mode (`DATASET_URL`, `BUCKET_URL`) takes only what a page needs from the dataset on Hugging Face - `lists/publishers.json`, the acts of a year, one act's details, records and markdown - and sends readers of raw files to the bucket; local use stays as it is (`lists/index.json` turned out to be the index of the API, not of the dataset)
- [x] `examples/`: Jupyter notebooks of using the project from Python, turned into marimo notebooks and exported as static pages with the website
- [x] The main page tells a newcomer the whole scope: what is gathered, where it is, the demo, the examples, how to start

## Phase 11: what the first big push showed

Found in the logs on 2026-11-22: the owner's push of the dataset stopped at 12800 of 14170 files.

- [x] `hub push` waits out the refusal of Hugging Face (128 commits an hour) and sends the same commit again; commits of 1000 files instead of 100

## Phase 12: texts of acts that have only a PDF

PP2, approved in the chat on 2026-11-22 (changelog phase 12). 125759 of 165006 acts have only a PDF.

- [x] `task text -- --pdf`: the text layer of every PDF-only act into `dataset/texts/<journal>/<year>/<address>.md`, with the checksums of both files, the same as markdown from HTML
- [x] PDFs without a text layer (scans) named in a list in the dataset, not guessed; OCR left for later
- [x] The readers (api, MCP, demo) show a PDF's text where there is no HTML, saying where it came from
- [x] Texts packed a year in a file, or not (Q16): a file per act stays, pushed 1000 a commit, 128 commits an hour
- [x] A damaged PDF stops nothing: what poppler still reads is kept, or the PDF is named in the list of scans with its error (DU/1932/38 stopped the owner's run)

## Phase 13: images, icons and what links show

PP3, partly solved by the owner (the gist submodule `resources/mediafiles`); the rest asked in the chat on 2026-11-22 (changelog phase 12).

- [x] Scripts with ffmpeg that make, from `resources/mediafiles`, favicons, icons of the web app manifest and an `og:image`, into the places each site takes them from
- [x] The main page, the website of the viewer, the docs and the demo carry them: favicon, manifest, `og:image` and the rest of the meta that makes a shared link show a card

## Phase 14: a friendlier webapp

Asked in the chat on 2026-11-22 (changelog phase 12). Embeddings wait for Q15.

- [x] Bulma for the layout of the viewer
- [x] A minimap of an act's ties in a corner (Cytoscape.js)
- [x] Relations of an act drawn the same way everywhere (mermaid.js)
- [x] A map of the whole law of Poland from the dataset, with presets (sigma.js)
- [x] Search with Typesense: a service of its own, filled from the dataset, read by the api

## Phase 15: the space and the push, as the owner met them

The owner's answer to Q16 (changelog phase 12): the space kept files of its marimo days, a push stopped on a damaged PDF.

- [x] `task resources:prune`: files there that are not here are deleted there, after a question, never in the bucket (the space keeps `app.py`, `development.md`, `requirements.txt`)
- [x] The space's Dockerfile follows the releases: `task resources:space` writes the version of the release into it
- [x] `hub plan` and the rest without a name say which names there are, instead of crashing

## Phase 16: translations

Q15, answered 2026-11-22 (changelog phase 12).

- [x] Check the owner's idea first: text nodes of a page found by a SHA-256 of their text, replaced from a language pack, without rewriting the page; a note of what works and what does not
- [x] `resources/locales/`: language packs as JSON (`EN-US.json` and the rest), listed in `.index.json` with EN-US the default
- [x] Python scripts with argostranslate that make the packs from the English texts (`task i18n:collect`, `task i18n:translate`; PL-PL, UK-UA, DE-DE)
- [x] The packs used by the viewer (GUI) and the introduction, with a switch of language
- [x] The documentation translated when the website is built, into `/docs/<language>/`, with a list of languages in every page (guides, glossary, home; the owner's words stay as written)
- [x] The launcher (TUI) and the manuals of the CLI in the language of the terminal (`P_JOL_ROLL_LANG`, else `LANG`): `tr()`, task descriptions included

## Phase 17: embeddings

Q15, answered 2026-11-22: after phase 12, a small local multilingual model.

- [x] Vectors of the texts by a small local multilingual model, kept in the dataset beside the texts (`task embed`, Ollama, bge-m3)
- [x] Search by meaning through them (Typesense takes vectors) and acts placed by meaning on the map (`meaning=1`, the preset `statutes-in-force-by-meaning`)

## Phase 18: what broke after v0.15.0, and the almanac

The owner's message, 2026-11-22 (changelog phase 18).

- [x] The image of webapp-server builds again: the language packs go into it
- [x] Texts hold no control characters (Hugging Face refused them as binary); texts made before are made again once, and push holds back any left
- [x] CodeQL alerts resolved: paths of the remote mode, parts of addresses, a rate limit, the extension's host, the folder server of i18n, the npm cache of checks
- [x] `docs/almanac/`: the cases met so far as issues ready for GitHub, the topics they belong to, a FAQ, and the rulesets and chains of events as in BOS
- [x] The almanac's mechanics in code: chains recalled by their events and the next event predicted (`task almanac:recall`), issues opened from the cases by the owner (`task almanac:issues`)

## Phase 19: Jarvis joins

The owner's message, 2026-11-22 (changelog phase 19).

- [x] Copilot's pull requests (#31-#33) merged into its own branch `dev/Jarvis`, and that branch into `development`
- [x] One flow for the bots (`bots.yml`, `bots-land.yml`): a pull request of Dependabot or Jarvis turned to its branch, merged, the branch checked by a dispatch of its own commit and landed in `development`; checks never take a ref from outside (CodeQL cache poisoning)
- [x] Jarvis written in: `.github/AUTHORS`, `AGENTS.md`, its guide `.github/copilot-instructions.md`, prompts in `.github/prompts/`, its machine in `copilot-setup-steps.yml`, and `docs/.agents/jarvis.md` kept for it


## Phase 20: the bucket tidied, the banner

The owner's message, 2026-11-22 (changelog phase 20).

- [x] `dev/Copilot`, `dev/Copilot-2`, `dev/Copilot-3` deleted, merged in `dev/Jarvis` before
- [x] The space keeps its cache and logs off the bucket it mounts at `/data` (`task resources:space` writes it); the 25945 files it had written there (`resources/`) deleted
- [x] The almanac: the case of the space writing into the bucket, its chain and its line in the topic (the banner, Sett's, landed from `dev/Sarverott`; the image is already in `resources/mediafiles`)

## Phase 21: the owner's notes across src

The owner's message, 2026-11-22, and the notes left in the code
(changelog phase 21).

- [x] Biome formats what is committed and merged, and checks what is pushed (`pre-commit`, `pre-merge-commit`, `pre-push`)
- [x] `at()` in core for every script, and the version patterns built from one part
- [ ] The viewer's assets: one colour picker, one graph maker, socket.io in its own file; the map with its imports on top, named handlers and its blocks as components
- [ ] The viewer split: layout, screens (acts, an act, the map) and their tabs, the minimap on both screens of acts; Biome formats and lints the templates and styles too
- [ ] Translations of the pages: only what is marked by the `i18n-texts-*` classes
- [ ] SHA-256 of the language packs made readable
- [ ] MCP: a folder per tool, answers shared, one server for stdio and for http - `/mcp` of webapp-server, so the space serves it too
- [ ] The website's data from yaml; `robots.txt`, `sitemap.xml`, `llms.txt`
- [ ] The introduction's data from yaml, and the page split into components
- [ ] The web interface of the workflows finds the workflows
- [ ] The desktop app split into the modules laid out

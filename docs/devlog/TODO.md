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
- [ ] `examples/`: Jupyter notebooks of using the project from Python, turned into marimo notebooks and exported as static pages with the website
- [ ] The main page tells a newcomer the whole scope: what is gathered, where it is, the demo, the examples, how to start

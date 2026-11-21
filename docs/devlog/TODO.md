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
- [ ] A static build of the explorer reading the dataset and the bucket on Hugging Face, into `resources/space/webapp` (Q6)
- [x] Links in `.github/README.md`: introduction, demo, bucket, dataset, the podcasts in 12 languages, documentation, code, the repository seen by other tools (Q12)

## Phase 5: gathering on another machine

- [x] Guide: the gatherer on a second machine - clone on the internal disk, resources on the drive through `.env` (read by every task now), what refuses and why, both ways home (Q10 picks one)
- [ ] Rich logging: every command writes structured lines to stdout and, when asked, to syslog (Q1)
- [x] A test container for Parrot OS: `tests/unittesting/parrot-os/headless-server/` with the case `-gather-and-parse`, against a local copy of the API (Q1)
- [ ] The Parrot OS trouble with the bare repository on an external drive, reproduced in that container and solved (Q1)

## Phase 6: services

The NOTEs Sett left in `compose.yaml` (changelog phase 6), each moved to its place.

- [x] `compose.yaml` includes one file per service from `resources/services/`; `web` renamed `webapp-server`
- [x] Directories with their ignore rules: `resources/configs/<purpose>/`, `resources/.containerdatavol/<volume>/`, `resources/secrets/`
- [x] `.env.example`; tokens left empty (after trimming) turn their optional functions off
- [x] `log-collector`: rsyslog, taking the logs of every service (Q1)
- [ ] `docs-server`: the documentation served locally
- [ ] `gatherer-daemon` and `parser-daemon`: gathering and parsing as separate units, started by a person
- [ ] `routing-proxy` (traefik) and `internal-dns` (dnsmasq), for local use with the desktop window
- [ ] `hf-demo-space`: the static explorer of phase 4 served from `resources/space/webapp`
- [ ] `llms-api-host`: ollama behind a litellm proxy
- [ ] `agentic-shell`: a shell gateway nearest to the host machine
- [ ] `hf-gateway`: WireGuard connections towards Hugging Face (optional)

## Phase 7: init and launcher

- [x] `task init`: checks what is installed, generates secrets, copies `.env.example`, once
- [x] `task help` lists the tasks (bare `task` runs it until the launcher exists)
- [ ] Bare `task` starts the launcher
- [ ] The launcher: a terminal menu in `src/tui/` over commands declared in `src/cli/`

## Phase 8: releases and routines

The inquiry of 2026-11-22 (changelog phase 8). Workflows run scripts of `scripts/devops/`, never multi-line blocks.

- [x] `README.md` is the page GitHub shows again: the links move there, `.github/README.md` goes; third-party references under a **DISCLAIMER:** quote; ExplainGitHub and GitReverse kept only in a scrapnote
- [x] `scripts/devops/`: the scripts of every workflow, one `.sh` each, with a common part and shellcheck in CI
- [x] Release on every push to `master`: checks, tag `v<version>` and the GitHub release - before the documentation and the website
- [x] After the release, in order: Read the Docs builds the tag, the website is built and pushed to `github-pages`, `master` goes back into `development`
- [x] Closing a phase: a workflow bumps Y (`vX.Y.Z`), pushes it to `development` and opens the pull request to `master`
- [x] Pull requests from `dev/*` into `development` merged by a workflow once checks pass
- [ ] Local routines as tasks: land `dev/<name>` into `development` and push, sync from `origin`, take the owner's edits
- [ ] `webpage/`: a React page, the introduction at the root of the website, with the MkDocs site under it


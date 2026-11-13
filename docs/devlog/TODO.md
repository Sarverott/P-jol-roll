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

## Phase 1: dependencies repaired

- [ ] Baseline recorded in `docs/agents/NOTES.md`: what install, check, build and tests give before any repair
- [ ] Forced downgrades undone: `crawlee`, `camoufox-js` and the rest resolved by their ranges again, the lock regenerated from them, not by `audit fix --force`
- [ ] Workflow SDK pilot on a version that builds and runs; the `nanoid` advisory recorded with its real reach (Q9)
- [ ] The termui experiment placed so that checks pass (Q4)
- [ ] Node pinned: `engines`, `.nvmrc`; `npm ci` from a clean copy passes
- [ ] `.github/dependabot.yml`: npm and Actions, grouped, into `development`
- [ ] `.github/workflows/checks.yml`: the same `task check` as the hooks
- [ ] Commit messages checked: commitlint and a `commit-msg` hook, like the BOS core

## Phase 2: say what it can do

- [ ] `docs/guides/features.md`: every function - works (and how it was verified), built and not verified, wanted
- [ ] `README.md` rewritten: what it is, getting started in five commands, where to read on

## Phase 3: BOS integration

- [ ] `.github/bos.json`: the loop (stations, contributors `dev/*`) and versioning, as in the BOS core
- [ ] Taskfiles: `task check` (= hooks = CI), `devlog:` included, standard names of BOS
- [ ] Anatomy checked against `bos-skillset`'s `bos-project` skill and the core's project template; what is missing added
- [ ] Version `0.1.0` and `CHANGELOG.md`, counted from the phases (Q8)
- [ ] The project's place in the workshop (Q7); notes for the BOS repositories in `forge/NOTES-for-repositories.md`

## Phase 4: a website of the project

- [ ] MkDocs Material over `docs/` (as the BOS core): the idea, the state, guides, glossary, devlog
- [ ] A state page made from `TODO.md` and `features.md`, so it never lies about what works
- [ ] `task docs:build` / `docs:serve`; publishing it (Q6)

## Phase 5: gathering on another machine

- [ ] Guide: the gatherer on a second machine - clone, resources on an external drive, how data comes back (Q10)
- [ ] The Parrot OS trouble with the bare repository on an external drive, reproduced and solved (Q1)

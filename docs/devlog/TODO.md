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
- [x] AGENTS.md: who may commit - identity and understanding confirmed by the members, own name and lineage in the co-authorship line, where edits go (Q3)
- [x] Agents' notes in `docs/.agents/`, their own domain that humans read (Q5)

## Phase 1: dependencies repaired

- [x] Baseline recorded in `docs/.agents/NOTES.md`: what install, check, build and tests give before any repair
- [x] Forced downgrades undone: `crawlee`, `camoufox-js` and the rest resolved by their ranges again, the lock regenerated from them, not by `audit fix --force`
- [ ] Workflow SDK pilot on a version that builds and runs; the `nanoid` advisory recorded with its real reach (Q9)
- [ ] The termui experiment placed so that checks pass (Q4)
- [x] Node pinned: `engines`, `.nvmrc`; `npm ci` from a clean copy passes
- [x] `.github/dependabot.yml`: npm and Actions, grouped, into `development`
- [x] `.github/workflows/checks.yml`: the same `task verify` as the hooks (red until Q4 is answered: the termui experiment fails Biome and tsc)
- [x] Commit messages checked: commitlint and a `commit-msg` hook, like the BOS core
- [x] Hooks that block: `@go-task/cli` 3.54, whose wrapper passes the exit code of `task` on (3.45.4 threw it away)

## Phase 2: say what it can do

- [x] `docs/guides/features.md`: every function - works (and how it was verified), built and not verified, wanted
- [x] `README.md` rewritten: what it is, getting started in five commands, where to read on

## Phase 3: BOS integration

- [x] `.github/bos.json`: the loop (stations, contributors `dev/*`) and versioning, as in the BOS core
- [x] Taskfiles: `task check` (= CI) runs everything, `task lint` is Biome alone, `verify` kept as its old name; `devlog:` included
- [x] Anatomy checked against `bos-skillset`'s `bos-project` skill and the core's project template: all of it present; added `.github/AUTHORS` (`bos project authors`) and `task devlog:state` (`bos devlog state`)
- [ ] Version `0.1.0` and `CHANGELOG.md`, counted from the phases (Q8)
- [x] Notes for the BOS repositories in `forge/NOTES-for-repositories.md` (outside git): `@go-task/cli` 3.54, npm 11 `allowScripts`, Biome 2.6, an eval case for the Dependabot skill
- [ ] The project's place in the workshop (Q7)

## Phase 4: a website of the project

- [x] MkDocs Material over `docs/` (as the BOS core): the idea, the state, guides, glossary, devlog
- [x] The state on the home page, counted at build from `TODO.md` and `features.md`, so it never says more than they do
- [ ] Publishing the website (Q6); `task docs:build` / `docs:serve` are there

## Phase 5: gathering on another machine

- [x] Guide: the gatherer on a second machine - clone on the internal disk, resources on the drive through `.env` (read by every task now), what refuses and why, both ways home (Q10 picks one)
- [ ] The Parrot OS trouble with the bare repository on an external drive, reproduced and solved (Q1)

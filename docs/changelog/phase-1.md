# Phase 1: dependencies repaired

Append-only: sections are added at the end and never rewritten. Each starts
with `UNIXUSAT=<ms since epoch> · commit <hash>`. The owner's words are kept
word for word.

## UNIXUSAT=1794699265791 · commit 582749f

The owner's answer to Q4 of BRAINSTORM.md, written in ORDERS.md from the
GitHub app. Word for word:

### Q4

````markdown
good idea with moving source code into tree in `src/tui`
````

**Decision:** the termui experiment moves into `src/tui/` with both configs, kept out of the checks until its packages are added.

## UNIXUSAT=1795297639670 · commit 065f981

The owner's answers to Q9 of BRAINSTORM.md, written in ORDERS.md during
the break for the heavy gathering (commit 065f981 on `dev/Sarverott`).
Word for word:

### Q9

````markdown
try to check dependabot's PRs and npm audit raports. you can turn it back to newest versions of dependencies like `nanoid` or `workflow` packages, but it should be not rich in vulnerabilities - try to minimize unneccecery risks.

If we need to consider replacements for any packages, please identify them and put forward your suggestions in `PROPOSALS.md`.
````

**Decision:** the open Dependabot pull requests and `npm audit` are gone through; dependencies go to their newest versions where that does not add advisories, `workflow` back to 5.x; packages worth replacing are named in PROPOSALS.md.

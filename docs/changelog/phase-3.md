# Phase 3: BOS integration

Append-only: sections are added at the end and never rewritten. Each starts
with `UNIXUSAT=<ms since epoch> · commit <hash>`. The owner's words are kept
word for word.

## UNIXUSAT=1795297639670 · commit 065f981

The owner's answers to Q7 and Q8 of BRAINSTORM.md, written in ORDERS.md during
the break for the heavy gathering (commit 065f981 on `dev/Sarverott`).
Word for word:

### Q7

````markdown
later on we will move it, for now we will add optional relative scoping where we place subelements inside scopes with detailed configs in scope's declaration file
````

**Decision:** the project stays where it is for now; an optional relative scoping is added: sub-elements placed inside scopes, each scope with its detailed configuration in a declaration file of its own (what that file is and where it lives is asked in Q11).

### Q8

````markdown
sync all versioning info and bumps process with this repository version value. we need to automate it to be as we use to per-commit bumping - you know what to do.
````

**Decision:** one version, the `version` of package.json, and every other version field (api, MCP, extension, Python projects) synced from it; every commit on a `dev/*` branch bumps the patch in the pre-commit hook, as in the BOS core, with the merge driver that keeps the higher version.

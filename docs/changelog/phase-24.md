# Phase 24: checks on what lands

Append-only: sections are added at the end and never rewritten. Each starts
with `UNIXUSAT=<ms since epoch> · commit <hash>`. The owner's words are kept
word for word.

## UNIXUSAT=1795376919822 · commit 720cad3

The owner's message in the chat, 2026-11-22, with the pull request of phase
23 (#39) open. The VS Code settings it names were committed as they were on
`dev/Sarverott` (aa916ad..cd7c3e9). Word for word:

```text
we have another errors there, now even before merging. also by the way i made copy of vscode settings from "bos-skillset" that is disallow editing of "docs/.agents/" contents from level of vscode - this is part of your own well-being for your contributions to healthier society systems. please check that tests, looks like something silly, but still can provide proper case for almanac solution of common error repeatings for future cases of issues.
```

The check `verify` of #39 failed in `tests/almanac.test.ts`: the new case
`container-bundler-imports` had its title with backticks on its page and
without them in its chain. `task check` had run before the case was
written and not again before landing.

**What was done:** the title is plain text on both sides. `task flow:land`
now runs `task check` itself, on exactly the commit that lands, and lands
nothing when it fails. The almanac has the case
`checked-before-last-change`: a report true of an earlier tree, the slip
that repeats.

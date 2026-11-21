# Phase 8: releases and routines

Append-only: sections are added at the end and never rewritten. Each starts
with `UNIXUSAT=<ms since epoch> · commit <hash>`. The owner's words are kept
word for word.

## UNIXUSAT=1795303839110 · commit 348470f

The owner's inquiry of 2026-11-22, given in the chat after the batch of Q11
and Q12. Turned into phase 8 of TODO.md and a rule for closing phases.
Word for word:

````markdown
about that 3-party links (e.g. `gitingest`, `gitmcp`, `deepwiki` and other) we can list them anyway as "known references to this project by third party sources" - if it makes mistakes then we are not responsible for that third party sources (that can be told in quota block that starts with `**DISCLAIMER:** ` text). how you placed them is right approach. you can drop these two you see as unnececery, but leave links to them in some scrapnotes - mistakes can lead to progress as we know by studies of organic evolutionary processes (diffrent point of view). idea with separed readme in `.github/README.md` we can abandon now, let's go back to idea with main README.md as presented on GitHub readme. add release production of project before update of documentation and before website building on githubpages. we want to bring here similar mechanics of advanced github action workflow CI/CD like in `gitrecon`, `blacksmith-organization-system` and `amoorion`.  we also want to add automation of PRs, merges into shared dev bbranch on local that sends changes by push to remote origin and else stuff related to routines that can be skipped by simple automation. for main index website we need to make additional dir in root of repo called "webpage" - there we will do some work with react page that will be combined with currently produced webpage - here it can bbe tricky. also tagging of releases, bumping of versions and more should be done in github workflows. all scripts used by workflows, instead of been placed in yaml files as multiline blocks of strings will be invoked from `.sh` files in "scripts/devops/" dir and subdirs. besides that continue other unfinished steps of opened phases, on every closing of phase when all steps is done make push from local to origin, open PR to master and bump version (number Y in semver - `vX.Y.Z`).
````

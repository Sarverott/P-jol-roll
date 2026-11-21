# Phase 4: a website of the project

Append-only: sections are added at the end and never rewritten. Each starts
with `UNIXUSAT=<ms since epoch> · commit <hash>`. The owner's words are kept
word for word.

## UNIXUSAT=1795297639670 · commit 065f981

The owner's answers to Q6 of BRAINSTORM.md, written in ORDERS.md during
the break for the heavy gathering (commit 065f981 on `dev/Sarverott`).
Word for word:

### Q6

````markdown
yes, website of project lives in `site/` dir that is builded for github pages branch publishing sourced from master branch and it replaces inside it content of branch (like in Amoorion - `https://github.com/Sarverott/amoorion/tree/github-pages`). demo of webapp explorer of documents static building (explained among notes of `compose.yaml` commentary) should be placed in `resources/space/webapp` dir to be pushed later on. website for documentation is delegated to be published as docs in readthedocs ( https://lex-polonica.readthedocs.io/ ).
````

**Decision:** `site/` is built from `master` and pushed whole to a `github-pages` branch, as Amoorion does, and GitHub Pages serves that branch; the documentation is published on Read the Docs (lex-polonica.readthedocs.io, `.readthedocs.yaml`); a static build of the explorer that reads the dataset and the bucket on Hugging Face goes into `resources/space/webapp`, to be pushed by the owner.

## UNIXUSAT=1795301693487 · commit 6647940

The owner's answers to Q11 and Q12 of BRAINSTORM.md, written in ORDERS.md
(commit 6647940 on `dev/Sarverott`); with them the TODO step of the
project's place was crossed out by the owner (e50ac19). Word for word:

### Q11

````markdown
check TODO.md - there is crossed out that step. leave notes for forging blacksmith organization system and bos-skillset
````

**Decision:** the place of the project and nested scopes are the BOS core's matter; this repository cares only about itself, as one project in the scope of Sarverott's GitHub repositories. Notes for `blacksmith-organization-system` and `bos-skillset` go to `forge/NOTES-for-repositories.md`.

### Q12

`````markdown
place that podcasts with listing of links to every language we had produce (11 m4a files in total)

> adding to README.md (but not main readme, this should be placed in ".github/README.md")

```md

- website that present introduction (github-pages) - classic onepage
- demo link
- bucket link
- dataset link
- all teaching materials (on Google drive): https://drive.google.com/drive/folders/1yklwKu-k9AXvT_CJlFhjhtmbaY3VSD7k?usp=sharing
    - DE: https://drive.google.com/file/d/1ooqmwBEpH2N_Q03VxA4-2hyegdwk9rfz/view?usp=drive_link
    - PL: https://drive.google.com/file/d/1yTeUXJgW3X8Y0A5nsNUuvsHuzLRexGQU/view?usp=drive_link
    - EN: https://drive.google.com/file/d/13MJHVm9r9u-rqBwDg-bPdhVRM2DNXEgf/view?usp=drive_link
    - `[...]` - _()_
- documentation: _(link to readthedocs here)_
- code repository and mirrors: (LATER at end of our current queue of phases)
    - github: https://github.com/Sarverott/P-jol-roll
    - gitlab (LATER)
    - bitbucket (LATER)
    - `[...]`
- related links
    - `[...]` - _(urls where we bring data and where we pot it further, like additional huggingface stuff, etc.)_
- https://gitingest.com/sarverott/p-jol-roll
- https://deepwiki.com/Sarverott/P-jol-roll
- https://gitmcp.io/Sarverott/P-jol-roll
- https://gitdiagram.com/Sarverott/P-jol-roll
- https://explaingithub.com/Sarverott/P-jol-roll
- https://gitreverse.com/Sarverott/P-jol-roll
- https://github.dev/Sarverott/P-jol-roll

```
`````

**Decision:** `.github/README.md` (the README GitHub shows, not the root one) gets the list of links as drafted: introduction website, demo, bucket, dataset, every podcast by language (12 files in the folder, not 11), documentation, code and mirrors (later), related links, and the tools that read the repository - marked as made by others and by machines.

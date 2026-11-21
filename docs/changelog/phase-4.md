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

# Phase 27: the space by its trusted publisher, and waited for

Append-only: sections are added at the end and never rewritten. Each starts
with `UNIXUSAT=<ms since epoch> · commit <hash>`. The owner's words are kept
word for word.

## UNIXUSAT=1795386229185 · commit 07e86ad

The owner's message in the chat, 2026-11-22, after merging the pull request
of phase 26 (#41) by hand and adding the secret `SNYK_TOKEN`. Word for word:

```text
well, space is builded and prepared inside workflow, but does not land on huggingface. I added trusted publisher CI/cd but also noticed variable in settings. let's perform proper next steps and after that loop if all will not endup with no errors then fixing time. contine
```

What was found: the release of v0.23.1 set the space's variable and asked
for a build, and the space did run v0.23.1 afterwards (`/openapi.json`) -
but the job said "built again" without waiting to see it. The space's
`README.md` lived only on Hugging Face (still "not legal advice", from
before Q18).

Understood as: the release takes the token of the trusted publisher the
owner added (`HF_TOKEN` the fallback), brings the space's files from git,
sets its variable, builds it, and waits until the space serves the release
- an error of Hugging Face fails the release with its own message. Then
the whole loop runs (phase-close, the gate, the automerge, the release, the
space) and what fails is fixed.

## UNIXUSAT=1795386796188 · commit dc5043b

The gate of #42 passed authors, verify, CodeQL and OSSAR; Snyk Code failed.
Its 10 high findings (path traversal and an XSS in the routes, a "secret"
that was the name of the settings in localStorage) were fixed in code. The
16 left were medium and low. The owner chose, in the chat, the first of
three choices put to it, word for word: "Fail on high only (Recommended)".
Snyk Code and Snyk IaC now fail the gate on high findings only; the rest
reaches the Security tab.

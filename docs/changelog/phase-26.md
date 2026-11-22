# Phase 26: one gate into master

Append-only: sections are added at the end and never rewritten. Each starts
with `UNIXUSAT=<ms since epoch> · commit <hash>`. The owner's words are kept
word for word.

## UNIXUSAT=1795384277333 · commit 05862ec

The owner's message in the chat, 2026-11-22, after merging the pull request
of phase 25 (#40). The workflows it names, Snyk (`snyk-security.yml`) and
OSSAR (`ossar.yml`), were committed by the owner on `dev/Sarverott`
(ed3d68e, 95cdf25) and merged into `development` by the owner (05862ec).
Word for word:

```text
great, check current state of repos. i made there initialized workflows related with scanning for security issues. I want all scannings to be made at PR from development to master, now they are been made all the time in every push and PR. verifying checks, codeql, snyk and else including with additional supports from Jarvis when it is required should be made in place of PR between development and master. if all endup with successes then we want an automerging of that PR (to protect it from being abused let's add check if author of PR is listed in AUTHORS from master branch file - if new contributor appears that never were listed there then he never was approved by known contributors, so that workflow fails). if it is possible then also please change settings so we will be abbble run github workflows from here... website of github becomes laggy lately.
```

Understood as: one workflow, the gate, on a pull request into master: the
author checked against `AUTHORS` of master first, then verify, CodeQL, Snyk
and OSSAR; Jarvis asked on the pull request when one fails; the pull request
`development` → `master` merged by itself when all pass. The scans and the
checks leave every push. Workflows started and followed from a terminal.

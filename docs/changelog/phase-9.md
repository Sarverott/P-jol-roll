# Phase 9: logs, the demo space, Dependabot's branch

Append-only: sections are added at the end and never rewritten. Each starts
with `UNIXUSAT=<ms since epoch> · commit <hash>`. The owner's words are kept
word for word.

## UNIXUSAT=1795307859917 · commit 60e97f3

The owner's inquiry of 2026-11-22, given in the chat after the first
releases (v0.3.1, v0.3.2). Turned into phase 9 of TODO.md; the launcher
and the services stay in phases 7 and 6. Word for word:

````markdown
command `task gather:changes` crushes - where we keep our logs of events like that? let's add this to our `.env` and example of it that default for now is to keep logs in local dir in repository root, simply in dir "logs/" with pattern like that: `log-${Date.now()}-${logmode}-${command||action||lounchmode}.log` where logmode is debug, warn, error, verbose etc. - this will improove time of finding that logs in current situation. current demo place is occupated by plain marimo example inside our space on huggingface - remove it all if you need and place there new one that uses `P-jol-roll` webapp server instead of whatever it is used now there. for this occasion you can add package producing inside github workflows of container that later on will be used by huggingface's space there. next go to louncher writting and prepare that replacement of defalut `task` call into selectable menu of options how we can run this project. every taskfile is inside tui an task context of REPL set of commands. then we can perform adding remaining containered services. but before all of that on remote push master to development, then pull all changes to local clone - i made couple merge actions from PRs by dependabot, please check his settings so he will be open PRs not directly to master but to separed "dev/dependabot" instead and then automerge for these will be allowed, but additional workflow running disable. only PR and pushes from "dev/dependabot" to "development" should be checked as usual (we do not need always to verify it if that becomes sometimes countless list of opened PRs with nothing to check there, once per push/pr to development will be enought). webpage is published and all sounds like it work so please continue.
````

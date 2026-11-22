# Phase 10: one bucket, one dataset, a lighter demo, examples

Append-only: sections are added at the end and never rewritten. Each starts
with `UNIXUSAT=<ms since epoch> · commit <hash>`. The owner's words are kept
word for word.

## UNIXUSAT=1795313564386 · commit 3edc1b5

The owner's inquiries of 2026-11-22, the third, written in INQUIRIES.md
(commit 3edc1b5 on `dev/Sarverott`). Turned into phase 10 of TODO.md; the
static explorer of phase 4 is done by the lighter demo here. Word for word:

````markdown
## resources and other sources

Instead of creating new dataset and bucket there we want to place all sources in single bucket as raw data and single dataset as training collection

```md
example content of resources/bucket:
- DU/
- MP/
- sejm/
- SAOS/
- `[...]`
- **README.md**         (here should be short notice about this place and links to github, documentation, website of project and other related things)
```

## logs from calling default task missing

i called "task" and that results lots of errors - i interrupt it with `ctrl+c` and it is missing in logs

here is tail of it:

```

ott/github-repos/P-jol-roll/resources/bucket/MP/1997/WMP19970160153.json'
02:17:10 [ERROR] [vite] file watcher error: ENOSPC: System limit for number of file watchers reached, watch '/home/sarverott/__WORKSHOP/forge/sarverott/github-repos/P-jol-roll/resources/bucket/MP/1997/WMP19970160153.pdf'
02:17:10 [ERROR] [vite] file watcher error: ENOSPC: System limit for number of file watchers reached, watch '/home/sarverott/__WORKSHOP/forge/sarverott/github-repos/P-jol-roll/resources/bucket/MP/1997/WMP19970160153.references.json'
02:17:10 [ERROR] [vite] file watcher error: ENOSPC: System limit for number of file watchers reached, watch '/home/sarverott/__WORKSHOP/forge/sarverott/github-repos/P-jol-roll/resources/bucket/MP/1997/WMP19970160154.json'
02:17:10 [ERROR] [vite] file watcher error: ENOSPC: System limit for number of file watchers reached, watch '/home/sarverott/__WORKSHOP/forge/sarverott/github-repos/P-jol-roll/resources/bucket/MP/1997/WMP19970160154.pdf'
02:17:10 [ERROR] [vite] file watcher error: ENOSPC: System limit for number of file watchers reached, watch '/home/sarverott/__WORKSHOP/forge/sarverott/github-repos/P-jol-roll/resources/bucket/MP/1997/WMP19970160154.references.json'
02:17:10 [ERROR] [vite] file watcher error: ENOSPC: System limit for number of file watchers reached, watch '/home/sarverott/__WORKSHOP/forge/sarverott/github-repos/P-jol-roll/resources/bucket/MP/1997/WMP19970160155.json'
02:17:10 [ERROR] [vite] file watcher error: ENOSPC: System limit for number of file watchers reached, watch '/home/sarverott/__WORKSHOP/forge/sarverott/github-repos/P-jol-roll/resources/bucket/MP/1997/WMP19970160155.pdf'
02:17:10 [ERROR] [vite] file watcher error: ENOSPC: System limit for number of file watchers reached, watch '/home/sarverott/__WORKSHOP/forge/sarverott/github-repos/P-jol-roll/resources/bucket/MP/1997/WMP19970160155.references.json'
02:17:10 [ERROR] [vite] file watcher error: ENOSPC: System limit for number of file watchers reached, watch '/home/sarverott/__WORKSHOP/forge/sarverott/github-repos/P-jol-roll/resources/bucket/MP/1997/WMP19970160156.json'
02:17:10 [ERROR] [vite] file watcher error: ENOSPC: System limit for number of file watchers reached, watch '/home/sarverott/__WORKSHOP/forge/sarverott/github-repos/P-jol-roll/resources/bucket/MP/1997/WMP19970160156.pdf'
02:17:10 [ERROR] [vite] file watcher error: ENOSPC: System limit for number of file watchers reached, watch '/home/sarverott/__WORKSHOP/forge/sarverott/github-repos/P-jol-roll/resources/bucket/MP/1997/WMP19970160156.references.json'
02:17:10 [ERROR] [vite] file watcher error: ENOSPC: System limit for number of file watchers reached, watch '/home/sarverott/__WORKSHOP/forge/sarverott/github-repos/P-jol-roll/resources/bucket/MP/1997/WMP19970160157.json'
02:17:10 [ERROR] [vite] file watcher error: ENOSPC: System limit for number of file watchers reached, watch '/home/sarverott/__WORKSHOP/forge/sarverott/github-repos/P-jol-roll/resources/bucket/MP/1997/WMP19970160157.pdf'
02:17:10 [ERROR] [vite] file watcher error: ENOSPC: System limit for number of file watchers reached, watch '/home/sarverott/__WORKSHOP/forge/sarverott/github-repos/P-jol-roll/resources/bucket/MP/1997/WMP19970160157.references.json'
02:17:10 [ERROR] [vite] file watcher error: ENOSPC: System limit for number of file watchers reached, watch '/home/sarverott/__WORKSHOP/forge/sarverott/github-repos/P-jol-roll/resources/bucket/MP/1997/WMP19970160158.json'
02:17:10 [ERROR] [vite] file watcher error: ENOSPC: System limit for number of file watchers reached, watch '/home/sarverott/__WORKSHOP/forge/sarverott/github-repos/P-jol-roll/resources/bucket/MP/1997/WMP19970160158.pdf'
02:17:10 [ERROR] [vite] file watcher error: ENOSPC: System limit for number of file watchers reached, watch '/home/sarverott/__WORKSHOP/forge/sarverott/github-repos/P-jol-roll/resources/bucket/MP/1997/WMP19970160158.references.json'
02:17:10 [ERROR] [vite] file watcher error: ENOSPC: System limit for number of file watchers reached, watch '/home/sarverott/__WORKSHOP/forge/sarverott/github-repos/P-jol-roll/resources/bucket/MP/1997/WMP19970170159.json'
02:17:10 [ERROR] [vite] file watcher error: ENOSPC: System limit for number of file watchers reached, watch '/home/sarverott/__WORKSHOP/forge/sarverott/github-repos/P-jol-roll/resources/bucket/MP/1997/WMP19970170159.pdf'
02:17:10 [ERROR] [vite] file watcher error: ENOSPC: System limit for number of file watchers reached, watch '/home/sarverott/__WORKSHOP/forge/sarverott/github-repos/P-jol-roll/resources/bucket/MP/1997/WMP19970170159.references.json'
02:17:10 [ERROR] [vite] file watcher error: ENOSPC: System limit for number of file watchers reached, watch '/home/sarverott/__WORKSHOP/forge/sarverott/github-repos/P-jol-roll/resources/bucket/MP/1997/WMP19970170160.json'
02:17:10 [ERROR] [vite] file watcher error: ENOSPC: System limit for number of file watchers reached, watch '/home/sarverott/__WORKSHOP/forge/sarverott/github-repos/P-jol-roll/resources/bucket/MP/1997/WMP19970170160.pdf'
02:17:10 [ERROR] [vite] file watcher error: ENOSPC: System limit for number of file watchers reached, watch '/home/sarverott/__WORKSHOP/forge/sarverott/github-repos/P-jol-roll/resources/bucket/MP/1997/WMP19970170160.references.json'
02:17:10 [ERROR] [vite] file watcher error: ENOSPC: System limit for number of file watchers reached, watch '/home/sarverott/__WORKSHOP/forge/sarverott/github-repos/P-jol-roll/resources/bucket/MP/1997/WMP19970170161.json'
02:17:10 [ERROR] [vite] file watcher error: ENOSPC: System limit for number of file watchers reached, watch '/home/sarverott/__WORKSHOP/forge/sarverott/github-repos/P-jol-roll/resources/bucket/MP/1997/WMP19970170161.pdf'
02:17:10 [ERROR] [vite] file watcher error: ENOSPC: System limit for number of file watchers reached, watch '/home/sarverott/__WORKSHOP/forge/sarverott/github-repos/P-jol-roll/resources/bucket/MP/1997/WMP19970170161.references.json'
02:17:10 [ERROR] [vite] file watcher error: ENOSPC: System limit for number of file watchers reached, watch '/home/sarverott/__WORKSHOP/forge/sarverott/github-repos/P-jol-roll/resources/bucket/MP/1997/WMP19970170162.json'
02:17:10 [ERROR] [vite] file watcher error: ENOSPC: System limit for number of file watchers reached, watch '/home/sarverott/__WORKSHOP/forge/sarverott/github-repos/P-jol-roll/resources/bucket/MP/1997/WMP19970170162.pdf'
02:17:10 [ERROR] [vite] file watcher error: ENOSPC: System limit for number of file watchers reached, watch '/home/sarverott/__WORKSHOP/forge/sarverott/github-repos/P-jol-roll/resources/bucket/MP/1997/WMP19970170162.references.json'
02:17:10 [ERROR] [vite] file watcher error: ENOSPC: System limit for number of file watchers reached, watch '/home/sarverott/__WORKSHOP/forge/sarverott/github-repos/P-jol-roll/resources/bucket/MP/1997/WMP19970170163.json'
02:17:10 [ERROR] [vite] file watcher error: ENOSPC: System limit for number of file watchers reached, watch '/home/sarverott/__WORKSHOP/forge/sarverott/github-repos/P-jol-roll/resources/bucket/MP/1997/WMP19970170163.pdf'
02:17:10 [ERROR] [vite] file watcher error: ENOSPC: System limit for number of file watchers reached, watch '/home/sarverott/__WORKSHOP/forge/sarverott/github-repos/P-jol-roll/resources/bucket/MP/1997/WMP19970170163.references.json'
02:17:10 [ERROR] [vite] file watcher error: ENOSPC: System limit for number of file watchers reached, watch '/home/sarverott/__WORKSHOP/forge/sarverott/github-repos/P-jol-roll/resources/bucket/MP/1997/WMP19970170164.json'
02:17:10 [ERROR] [vite] file watcher error: ENOSPC: System limit for number of file watchers reached, watch '/home/sarverott/__WORKSHOP/forge/sarverott/github-repos/P-jol-roll/resources/bucket/MP/1997/WMP19970170164.pdf'
02:17:10 [ERROR] [vite] file watcher error: ENOSPC: System limit for number of file watchers reached, watch '/home/sarverott/__WORKSHOP/forge/sarverott/github-repos/P-jol-roll/resources/bucket/MP/1997/WMP19970170164.references.json'
02:17:10 [ERROR] [vite] file watcher error: ENOSPC: System limit for number of file watchers reached, watch '/home/sarverott/__WORKSHOP/forge/sarverott/github-repos/P-jol-roll/resources/bucket/MP/1997/WMP19970170165.json'
^Ctask: Signal received: "interrupt"
task: Signal received: "interrupt"

task web:dev ended with 1 - Enter goes back to the menu task: Failed to run task "default": exit status 130

```

## HF space instead of download all every time should use prepared dataset and files placed in the bucket

demo presented in space there is special version of our `P-jol-roll` webapp that instead of loading live copy into local uses static data prepared in dataset, especially indexings and else optimalizations for make easier search online data by demo

- fetch of https://huggingface.co/datasets/Sarverott/polish_national_law_docs/raw/main/lists/index.json gives us staticly accessible and prepared data that can be used in live demo version - don't load all that you can, load only what is required in that mode

- references to raw data gathered from goverment sites is accesible on bucket so link it simply similar to local run but with small adjusting of URL

standard local usage stays as-is but remote demo becomes lighter

## old marimo app in space

rebuild what remains on remote repository to present examples of usage that project in live action python integrations - at least try to prepare something like that, first as examples in main `P-jol-roll` repo inside `examples` dir as jupyter notebook examples, then builded and parsed to marimo examples, then finally prepared as produced static web output to be added with webpage building on "github-pages" branch publishing.

also update main page of project with all that we need in first encounter with all that scope.
````

## UNIXUSAT=1795313564386 · commit d80eb9e

Said in the chat with the orders of commit d80eb9e. Word for word:

````markdown
alright, ready. orders and inquiries filled with info. from now proposals can be performed by orders file (ORDERS.md is decision making so that sound logical)
````

**Decision:** ORDERS.md decides the proposals of PROPOSALS.md as well as
the questions of BRAINSTORM.md: the owner writes `### PP<n>` there, and a
decided proposal moves into the changelog like an answered question. Said
in `docs/devlog/README.md`, the header of ORDERS.md, PROPOSALS.md and
AGENTS.md.

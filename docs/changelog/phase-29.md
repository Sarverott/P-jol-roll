# Phase 29: announcements in the discussion

Append-only: sections are added at the end and never rewritten. Each starts
with `UNIXUSAT=<ms since epoch> · commit <hash>`. The owner's words are kept
word for word.

## UNIXUSAT=1795486842251 · commit ce1791c

The owner's message in the chat, 2026-11-24, after the report of phase 28.
Word for word:

```text
sounds awsome. boards ready and authorization refreshed, but i'm not sure if you want me to do something with pages or not - clearify that please. also by the way if we can perform automation of discussions integration like other feachers until now also to make that work too then look at here: https://github.com/Sarverott/P-jol-roll/discussions/107 - if we can do it then this is simple task... at least it should be easy. besides that if nothing is on our way then continue your work
```

The discussion it points at, #107 "about latest changes and releases" in
Announcements, opened by the owner the same day. Its text, word for word:

```text
here we present 

- releases published
- updates of things
- progress with staging
- milestones, phases and steps that we mark as done

that should been made in project by workflow dedicated to monitor this kind of events...
```

Understood as:

- **The pages.** The report of phase 28 said that the pages of the wiki
  named `Devlog…` and `Almanac…`, and the issues made from the devlog, are
  rewritten by the next copy. That was a warning, not a task: nothing is
  asked of the owner there. The board the owner made ready already held
  every issue (62 cards).
- **The discussion.** A workflow says in #107 what happened, one comment
  per event: a release published (with how its image, space, documentation,
  website and the merge back ended), a phase closed on its way to `master`
  (the staging: its pull request and gate), and the steps ticked on
  `development` with the phases and milestones they finished. The markdown
  stays the source; `scripts/devops/github/announce.py` reads it.
- **Then the work continues.** The phases planned in phase 28 move one
  number on (the mastermind's first voice is phase 30 now); they start as
  planned.

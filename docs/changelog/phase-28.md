# Phase 28: the host in its corner, the devlog on GitHub, the wiki and the packs

Append-only: sections are added at the end and never rewritten. Each starts
with `UNIXUSAT=<ms since epoch> · commit <hash>`. The owner's words are kept
word for word.

## UNIXUSAT=1795476500698 · commit 8914abf

The owner's message in the chat, 2026-11-24, after the report of phase 27.
Word for word:

```text
sounds like all works well, but it was yesterday actually so ckeck all at current state. as for version of space on HF for clearer display of version we have in front of us add there at top left or right corner fixed position in css version of release and mode of app we have in front of us. this way when we look at space hosted on HF we can after first look that it is for example: version 0.24.99 ; docker containered app production release ; web interface on huggingface that uses static dataset ; read-only demo produced by workflow ; commit <hash id of commit> ... well... endsup to be long, so display only version and HF-demo-readonly-container and after hover (or touch on phones) show full notice top note with max width of 100vw and all that i just wrote in full info. let's make it never have exotic glich case i think about right now: make that area of hover never change sizing - this will prevent case of this box covering all over gui area so we never are able to not hover it with our cursor poining. as i look over our vision, todo, roadmap and other places where we prepare planning in devlog there is missing next phases we does not yet determined as part of our jouney. let's go with that first by looking at milestones and continue with further realizations of goals. we have that place where we can set up our milestones on github repository and things related with kanban projects - can we use it to bring what we had done in markdown into that interfaces there? can we also use github issues at every Q and PP entries we have? that would be interesting if yes. also for devlog display and almanac cases i made here wiki initialized: `https://github.com/Sarverott/P-jol-roll.wiki.git` and for to be clear - place there copy of them, don't use it as replacement placing. to keep the state of it make it git submodule repo. also by the way all translations we also will be delegate into subrepo (https://gist.github.com/0b86ecd07d55426754759bdff5550d87.git) but this time that case is opposit from wiki situation - that submodule will be source for project, not only place where we will store results of build generating. as for readthedocs and documentation we want to for sure hide devlog and almanac from there and leave only reference links on lists of docs content to that wiki. i think that is enought for us for now so go ahead and give me know when something will be requiring my attention
```

The state checked first, 2026-11-24: `master` and `development` as phase 27
left them, the gate and the release of #42 green, the space RUNNING and
serving v0.24.2. `ORDERS.md` still held the answer to Q19, already moved
into phase 25; it is back to its header.

Understood as:

- **The corner.** Every host of the viewer that has the api says what it is
  in a fixed corner: `v<release> · <short name>`, the short name made of
  where it runs (`HF-demo`, `remote`, `local`), whether it writes
  (`readonly`, `writing`) and `container`. A hover, a focus or a touch shows
  the whole note under it, at most as wide as the screen: the release, a
  container or not and production or not, where its data comes from,
  read-only or writing and who built it (the workflow's run), the commit.
  The corner keeps one size whatever it says, and the note takes no pointer,
  so the note can never cover the corner. The api says it at `/api/host`;
  the release gives the image its commit and run.
- **Phases ahead.** The milestones are read again and the phases of M4 and M5
  still undetermined are planned from the owner's own words (Q17, Q18, PP4,
  the milestones of ROADMAP) - planned, not started.
- **GitHub's own places.** Yes: the milestones of ROADMAP become milestones of
  the repository; every phase an issue in its milestone, closed when its
  TODO is ticked; every `Q<n>` and `PP<n>` an issue, closed when answered or
  decided; all of them on a project board (kanban). The markdown stays the
  source; a task brings it there again whenever it changes.
- **The wiki** is a git submodule of this repository and holds a copy of the
  devlog and the almanac, made by a task - the files here stay where they
  are.
- **The language packs** come from their gist, a submodule at
  `resources/locales`: the source the project reads, opposite to the wiki.
- **The documentation** (Read the Docs) no longer publishes the devlog and
  the almanac; its list of contents links to them in the wiki.

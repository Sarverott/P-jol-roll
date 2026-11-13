# VISION

P_JOL_ROLL gathers the whole written law of Poland - every act published in
Dziennik Ustaw and Monitor Polski since 1918 - from the open ELI API of Sejm,
and keeps it in the open: raw files in a bucket and tables in a dataset on
Hugging Face. On top of that it turns the texts into markdown, ties acts to
each other, to the work of Sejm and to court judgments, and shows all of it
to people and to programs.

The far goal is in the owner's first scrapnote
([scrapnote-1791881492510.md](scrapnote-1791881492510.md)): a small model
and an agent that read this law and give **a devil's advocate to every person**
in the country, as open source.

## Principles

- **Polite to the source.** Own User-Agent, two requests at a time, a pace
  per minute, nothing asked twice. A person starts every gathering; hosts and
  interfaces only read what is here.
- **Every file can be checked.** A gathered file gets a checksum record the
  moment it lands; markdown keeps the checksums of both itself and its HTML.
  Anyone can go back to the source and compare.
- **Data in the open, decisions with the owner.** Gathered data goes to
  Hugging Face only by the owner's move; an automated run waits for a "yes".
- **A tree, not a flat scope.** Files sit in directories of their kind;
  types and interfaces one per file in `src/core/vars/`.
- **One core, many ways in.** The core gathers and reads; the api, MCP
  server, website, desktop window, app and extension only show what it reads.
- **The BOS craft loop.** Branches `development` and `dev/<name>`, one
  finished step per commit, phases of TODO.md, questions in BRAINSTORM.md.

## The idea of each phase

| Phase | Idea |
| ----- | ---- |
| 0 | clear the ground: the devlog and the loop of BOS, the owner's edits taken in |
| 1 | dependencies repaired: versions that resolve and work again, kept so by checks and Dependabot |
| 2 | say what it can do: features listed with evidence, a README that starts a newcomer |
| 3 | BOS integration: settings, tasks, hooks and versions the way every BOS project has them |
| 4 | a website that presents the idea and the state of the project |
| 5 | gathering on another machine: the heavy downloading delegated, and the trouble of Parrot OS solved |

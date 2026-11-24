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
  interfaces only read what is here, except a host on this machine started
  with `--allow-writing`, where a person's yes starts a job (Q19).
- **Every file can be checked.** A gathered file gets a checksum record the
  moment it lands; markdown keeps the checksums of both itself and its HTML.
  Anyone can go back to the source and compare.
- **Data in the open, decisions with the owner.** Gathered data goes to
  Hugging Face only by the owner's move; an automated run waits for a "yes".
- **A tree, not a flat scope.** Files sit in directories of their kind;
  types and interfaces one per file in `src/core/vars/`.
- **One core, many ways in.** The core gathers and reads; the api, MCP
  server, website, desktop window, app and extension only show what it reads.
  Every function is declared once, in one catalog, and every way in - the
  viewer, the launcher, the REPL, the commands, the api, MCP - offers it from
  there; a host that may not do it shows it disabled (phase 22).
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
| 6 | services: every part of the project a container of its own, logs collected in one place |
| 7 | init and launcher: a newcomer types `task` and is led |
| 8 | releases and routines: a release on every merge into master, versions and phases closed by workflows, the rest of the routine by tasks |
| 9 | logs where they are found, the demo space on the project's own server, Dependabot on its own branch |
| 10 | one bucket of raw files and one dataset for training, every source inside; a demo that reads what the dataset prepared; examples of using it from Python |
| 11 | what the first big push showed: pushes that finish |
| 12 | the text of every act that has any: PDFs without HTML read too (PP2) |
| 13 | the images of the project made into icons and cards, so every link shows it |
| 14 | a friendlier webapp: a layout, a minimap of ties, drawn relations, a map of the whole law, search |
| 15 | the space and the push as the owner met them: old files pruned, the space following releases |
| 16 | every interface in more languages: packs made by argostranslate, applied without rewriting the pages |
| 17 | acts by meaning: vectors of the texts from a small local model, for search and the map |
| 18 | the almanac: what was learnt the hard way, as cases, chains and rules |
| 19 | Jarvis joins: the bots' pull requests flow through branches of their own |
| 20 | the bucket tidied: the space keeps its cache off it |
| 21 | the owner's notes across src: small components, data in yaml, Biome in every hook |
| 22 | every function in every way the project runs, mapped first; a viewer that shines: more data, plots, a playable history of the law |
| 23 | the image builds again: no imports of a bundler's dialect |
| 24 | checks on what lands: `task flow:land` checks the commit it merges |
| 25 | checks before a push; the writing functions behind a switch of a host on this machine (Q19) |
| 26 | one gate into master: the author a member, every check and scan, then automerge |
| 27 | the space by its trusted publisher, and waited for until it serves the release |
| 28 | the host says what it is in a corner; the devlog on GitHub (milestones, issues, a board), copied into the wiki; the language packs from their gist |
| 29 | what happened said by the workflows in the discussion of announcements (#107): steps, phases, milestones, the staging, releases |
| 30 | the mastermind's first voice: deepseek-R1 answers a question with the acts it read through the MCP tools, each cited by its ELI; the host's Ollama for development, compose with Ollama and its models for other machines |
| 31 | families of models as teams (gemma4 and its kin first, then ministral, llama, qwen, Bielik), Ollama's storage on its own drive, every conversation kept in `resources/conversations/` |
| 32 | the demo's AI: the visitor signs in with Hugging Face and the mastermind answers on the visitor's token through Inference Providers; a chat in the viewer |
| 33 | the chat in every language pack; the executive agent - a small qwen in the agents' shell (opencode), reading the law through MCP |
| 34 | the advanced strategy: a weak answer of the host's model on to a deepseek hosted by Hugging Face; the Python stack in `stacks/python/` |

### Phases ahead (planned in phase 28)

Planned from the owner's own words - the milestones, the law mastermind of
Q18, the devices of Q17, PP4 - and not started: each begins when the owner
says so, and its TODO items are written then. Numbers may move (one on in
phases 29, 31 and 32).

| Phase | Milestone | Idea |
| ----- | --------- | ---- |
| 35 | M4 | the work of Sejm as discussion: the records of sittings gathered from the Sejm API, who said what about which act |
| 36 | M4 | social simulations offline (MiroFish or OASIS) of how a change of law meets people; the code of law analysed deeply, improvements proposed - M4 closes |
| 37 | M5 | the dataset and the bucket as torrents pointed to by IPFS; the Go stack begins |
| 38 | M5 | mirrors per voivodeship or district on a WireGuard network, balanced by Traefik |
| 39 | M5 | no centre: the mirrors agree on the law by Cosmos SDK, the checksums of `task seal` the shared truth |
| 40 | M5 | the person's devices in the desktop app: printers, phones, FIDO keys for signing (Q17) |
| 41 | M5 | off the grid: ESP32 boards as mesh nodes of the law (PP4, when decided) |

## The law mastermind (Q18, phase 22)

The devil's advocate is advice that everyone can afford - "not (formally)
legal advices", as the owner put it, not a lawyer's hour per question.
The owner's plan for it:

- several instances of **deepseek-R1** at once: small ones and the embedder
  in Ollama on the host, the advanced strategy on a deepseek hosted by
  Hugging Face;
- a small **qwen** as the executive agent in the shell (an opencode host),
  reading the law through the MCP tools;
- **social simulations** and the processing of parliamentary discussion,
  offline, by MiroFish or OASIS;
- the whole code of law of Poland analysed deeply, and improvements to it
  proposed;
- a **second stack in Python** for the models and simulations, and a **third
  in Go** for the decentralisation circuits (Cosmos SDK, IPFS, Traefik,
  WireGuard, torrents), so they keep their integrity inside.


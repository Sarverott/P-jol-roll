# P_JOL_ROLL — guide for agents

Polish Journals of Laws resources operational lurker loader: gathers every act
published in Dziennik Ustaw and Monitor Polski, keeps tables as a dataset and
the raw files of every act in a bucket, to be parsed later.
The workshop-level rules in `~/__WORKSHOP/AGENTS.md` still apply.

Who you work with and how a session goes is written down in the portfolio
repository: `../Sarverott/AGENTS.md` and `../Sarverott/docs/agents/`.

## Rules

1. **Who may commit.** Before your identity and your understanding of the
   laws here are confirmed by the contributors - the members, digital and
   organic - you shall not commit here. A member is confirmed when a member
   already confirmed writes them into `.github/AUTHORS`; Cleo (Claude Code)
   was confirmed by Sett in November 2026. Every AI that commits has its own
   name and signs every commit with a co-authorship line carrying that name
   and its lineage (the model it runs on), the same as its line in
   `.github/AUTHORS`: Cleo signs
   `Co-Authored-By: Cleo (Claude Opus 5.5) <noreply@anthropic.com>`.
   Jarvis (GitHub Copilot) was confirmed by Sett on 2026-11-22 and signs
   `Co-authored-by: Jarvis (GitHub Copilot) <198982749+Copilot@users.noreply.github.com>`;
   its guide is `.github/copilot-instructions.md`. An agent
   not yet confirmed leaves its edits uncommitted in the working tree and
   says what it changed and why; a member commits them or confirms it.
2. **Where edits go: the BOS craft loop.** A member works on its own
   `dev/<name>` branch (`dev/Cleo`), made from `development`; never on
   `master`. One finished, checked step of `docs/devlog/TODO.md` is one
   conventional commit (`type(scope): subject`) that ticks its box; the
   pre-commit hook gives it its own version (the patch bumped, every copy
   synced, `src/devtools/version.ts`). Never
   `--no-verify`. When a batch is done, `dev/<name>` is merged into
   `development` with `--no-ff` (`task flow:land` does it and pushes). A confirmed member pushes `development`
   and its own `dev/<name>` freely (Q2, answered 2026-11-15); `master`, tags,
   releases and repository settings are always asked for first. The one way
   into `master` without a person is the gate (`gate.yml`, phase 26): a pull
   request `development` → `master` whose author is listed in `AUTHORS` of
   `master` and which passes every check and scan (verify, CodeQL, Snyk,
   OSSAR) merges itself and starts the release. The checks and scans run
   there, not on every push; on this machine the pre-push hook checks.
   **The owner's edits** found in the working tree go first, as they are,
   one commit per change on `dev/Sarverott`, with a message saying how the
   agent understood them; then that branch is merged into `development`.
   Edits the owner makes on GitHub land on `development`; take them in with
   a fast-forward before branching.
   **Bots' branches.** Dependabot and Jarvis work through pull requests,
   each into its own branch (`dev/dependabot`, `dev/Jarvis`); one opened
   against `master` or `development` is turned there by `bots.yml`, merged
   (Jarvis's when it is no longer a draft), the branch checked once and
   landed in `development` (`bots-land.yml`). Cleo may merge or land
   `dev/Jarvis` by hand the same way, and writes what it saw for Jarvis
   in `docs/.agents/jarvis.md`, as Jarvis cannot keep notes here.
   **Agents' own domain** is `docs/.agents/`: agents write there, humans
   read it and do not write, edit or delete.
3. **Tasks arrive as `// NOTE: ` comments** (in READMEs and Taskfiles too).
   Build what is concrete, keep the NOTE in place, add `ANSWER:` when the note
   asked a question, and report the notes you left with the question that
   blocks them.
4. **Gather politely, and let Sett start it.** The source is an open API.
   Requests carry the project's own User-Agent and run two at a time. Sett
   runs the gathering and the checkup; an agent verifies with tests and a
   local copy of the API, and does not run them against the real source
   unless asked. Hosts and interfaces (api, MCP, website, extension) only
   read `resources/`; none of them may start gathering - except a host on
   this machine started with `--allow-writing` (the desktop app, `task
   serve -- --allow-writing`), which starts the writing functions of the
   catalog as jobs, each after a person's yes (Q19, changelog phase 25).
   A public host (the space, the container, the website) never does; the
   space's chat asks a model only on the signed-in visitor's own Hugging Face
   token (phase 32), never on the owner's. An
   agent does not start a job against the real source unless asked.
5. **Nothing is sent to huggingface by an agent.** `resources/dataset`,
   `resources/space`, `resources/bucket` and `resources/conversations` are filled locally; pushing and
   syncing them is Sett's move.

## Questions and plans

`docs/devlog/README.md` says how a batch moves. In short:

| It is | It goes to |
| ----- | ---------- |
| the owner's words | `docs/devlog/INQUIRIES.md` / `ORDERS.md` (or the chat), then `docs/changelog/phase-<n>.md`, word for word |
| a plan | `docs/devlog/VISION.md`, `ROADMAP.md`, `TODO.md` |
| a question for the owner | `docs/devlog/BRAINSTORM.md` as `## Q<n>. <title>` with a *Lean:*; never settled in code before the answer |
| an idea for debate | `docs/devlog/PROPOSALS.md` as `PP<n>`; the owner decides it in `ORDERS.md` |
| an agent's findings and what was not verified | `docs/.agents/` (`NOTES.md`, `things-to-check.md`) |
| a problem met and solved | `docs/almanac/`: its case, its chain, a line in its topic |
| work for another repository | `~/__WORKSHOP/forge/NOTES-for-repositories.md`, never the other repository itself |

## Source

ELI API of Sejm, `https://api.sejm.gov.pl/eli` (OpenAPI under `/eli/openapi/`).
`GET /` names everything it gives, and the gatherer follows that index:

| Address | Gives | Kept in |
| --- | --- | --- |
| `/statuses` `/types` `/references` `/keywords` `/institutions` | lists | `dataset/lists/<name>.json` |
| `/acts` | journals with years: `DU` 97907 acts since 1918, `MP` 66730 since 1930 (2026-10-13) | `dataset/lists/publishers.json` |
| `/acts/DU/2026` | every act of the year in one answer | `dataset/acts/DU/2026.jsonl` |
| `/acts/DU/2026/1` | details | `bucket/DU/2026/<address>.json` |
| `/acts/DU/2026/1/references` | references to other acts | `bucket/DU/2026/<address>.references.json` |
| `/acts/DU/2026/1/text.pdf` | published PDF, when `textPDF` | `bucket/DU/2026/<address>.pdf` |
| `/acts/DU/2026/1/text.html` | HTML, when `textHTML` | `bucket/DU/2026/<address>.html` |
| `/acts/DU/2026/1/struct` | skeleton of text, when `textHTML` | `bucket/DU/2026/<address>.struct.json` |
| `/acts/DU/2026/1/text/U/<name>` | other texts named in details | `bucket/DU/2026/<address>.U.pdf` |
| `/changes/acts?since=` | acts changed since a day | taken again by `gather --since` |

Two more sources have their own directories (`docs/guides/sources.md`):
work of Sejm, `https://api.sejm.gov.pl/sejm`, in `resources/dataset/sejm`
and `resources/bucket/sejm`; court judgments of SAOS,
`https://www.saos.org.pl/api`, in `resources/dataset/SAOS`. One bucket of
raw files and one dataset of tables hold every source (phase 10).

Websites that show the same acts to people are listed in
`resources/frontends.json`. They are visited only by `checkup`, with a
browser, one page at a time.

## Layout

```
src/core/              the gatherer itself; everything below is its tree
  main.ts              arguments; commands gather, seal, compile, text, sejm, saos, checkup, hub - usage is written there
  crawl.ts             one polite walk over addresses of an API, queue in memory
  apihandlers/         one file per source: addresses, shapes, and the walk when the source has its own
    eli.ts             addresses and shapes of ELI API
    sejm.ts            other source: processes and prints of Sejm
    eu.ts              the law of the EU: every act of a year from the Publications Office (SPARQL), Polish texts (phase 42)
    regional.ts        local and regional law: the voivodeships' journals through their ELI API (phase 43)
    tenders.ts         public tenders: e-Zamówienia's notices by day, TED's for Poland (phase 43)
    sittings.ts        the sittings of Sejm: the days of a term, who spoke on each, their texts (phase 35)
    saos.ts            other source: court judgments
  methods/             what a command does
    gather.ts          index -> lists -> years, then files of acts year by year; --since for changes
    seal.ts            checksums of gathered files: records, and check against them
    international.ts   the international agreements the journals published, indexed (phase 42)
    analyse.ts         the code of law analysed: every act in force against its ties, into dataset/analysis/ (phase 36)
    map.ts             the map of the whole law: acts of a preset (presets.ts) placed by ForceAtlas2 into dataset/map/
    compile.ts         tables of details and references from raw files
    checkup.ts         browser (Camoufox) visits websites that show acts, writes what it saw
  parsing/             raw files into text
    text.ts            markdown from html, with checksums of both; from PDFs of acts without html too (--pdf)
    pdf.ts             the text layer of a PDF through pdftotext of poppler
  resources/           the local sides and their way to huggingface
    store.ts           where gathered things are written
    hub.ts             sync of resources/ with huggingface, file by file (@huggingface/hub)
  vars/                every type and interface, one per file, flat inside each directory
    interfaces/        <Name>.interface.ts, and index.ts with namespaces GatheringScope, HuggingfaceScope
    types/             <Name>.type.ts, and index.ts with the same namespaces
  logging/             setup.ts: the one logger of every command (text or JSON lines, a file per run in logs/, syslog when asked) - import it first, then logRun(<command>)
  search/              typesense.ts: every act into Typesense (task search:index) and /api/search over every year
  catalog/             every function of the project once (procedures.ts), for every way it runs: the launcher, the REPL,
                       task do, /api/catalog, the viewer; run.ts words into values and task arguments, map.ts the map of functions,
                       jobs.ts the writing ones run as jobs by a host on this machine (--allow-writing, Q19)
  reading/             gathered data as readers see it - the only thing hosts below lean on
    library.ts         journals, pages of acts, one act, its text, ties and files; reads resources/ only
    dataset.ts         the rest of the dataset: work of Sejm, judgments, lists of the source, acts counted (task stats)
    debates.ts         an act in Sejm: the days its bill was read on, the statements naming its print (phase 35)
    diagram.ts         the ties of an act as one mermaid flowchart, for every interface
    embeddings.ts      the vectors of task embed, and a question as a vector of the same model (Ollama)
    remote.ts          the remote mode of the demo: resources/ as a cache of the dataset on huggingface, raw files on the bucket
src/openapi/           http api (/api, /openapi.json) with socket.io notices, serves dist/web too; writing.ts /api/jobs, only with --allow-writing on this machine
src/mcp/               MCP server for AI agents, read-only: server.ts and tools/ (a folder per tool); main.ts over stdio, /mcp of the api over http; client.ts
src/mastermind/        the law mastermind (phase 30): ask.ts a question answered by a model (the host's Ollama, deepseek-r1:8b)
                       reading the acts through the MCP tools in rounds, citations checked; main.ts task mastermind:ask;
                       /api/ask of an api started with MASTERMIND_URL, or of the space on the visitor's own Hugging Face
                       (src/openapi/ask.ts, oauth.ts: hf_oauth, phase 32) - the viewer's tab #ask; record.ts every conversation into
                       resources/conversations/<family>/<instance>/; agent.ts the executive agent (task agent), note.ts its only
                       writing (resources/agent/); strategy.ts the advanced strategy (phase 34): a weak answer goes on to a
                       deepseek hosted by Hugging Face (--escalate, --hard) - docs/guides/mastermind.md
src/workflows/         durable runs (Workflow SDK on Nitro): flows/ daily.ts and steps.ts, server/api/ start and approve;
                       built from inside that directory; the run pushes only after a person answers "yes"
src/gui/               index.vue - the one viewer that every interface shows (Bulma), made of layout/, screens/ (acts, an act, the map,
                       the rest of the dataset, plots, statistics with the history, settings; #acts, #act/DU/2026/1, #map, #data,
                       #plots, #statistics, #settings) and components/; assets/ what they share (state, route, ColorPick, graph,
                       socket, settings, counting, webmcp); "Terms of use" gets AUTHORS and links as a prop (src/web/data/credits.ts)
src/web/               Astro website carrying the viewer (pages/), built into dist/web; data/ read by node:fs at build (no ?raw imports)
src/desktop/           Electron app: main.js puts together core (the api), window, loadingmodal, menus, hotkeys-shortcuts,
                       apptray, notifications, dialogs, deeplinks (p-jol-roll://act/DU/2026/1), printing (print, PDF),
                       devices (phase 40: signing with a FIDO key, labels.js for Bluetooth sticker printers, a QR code for a
                       phone; the page's side src/gui/assets/devices.js); task desktop:check, no screen
src/app/               web app manifest and Capacitor config of the android app
src/firefox-ext/       browser extension (manifest v3, loads in Chrome too)
src/chrome-ext/        empty, kept
src/tui/               the launcher (launcher/: main.ts the menu bare `task` opens, select.ts); Sett's TermUI experiment (index.tsx, main.js, termui.config.*) out of the checks
src/cli/               commands of the launcher: tasks.ts (every task of every Taskfile, grouped, run inside `script` so the output lands in the launcher's log and Ctrl+C stops the task alone), repl.ts (tasks as commands)
src/i18n/              translations by hooks: sha256.ts, hooks.ts (hookOf, translate, t for terminals), dom.ts (collect, apply, follow), browser.ts (the chosen pack on a page), terminal.ts (tr() for the launcher and the CLI) - docs/guides/translations.md
src/almanac/           the almanac's mechanics, as in BOS: patterning.ts (chains of events recalled, the next predicted), ruling.ts (rules judged), main.ts (task almanac:*) - docs/almanac/
src/devtools/          tools of the repository itself: version.ts (one version: sync, bump per commit, merge driver), init.ts (task init), merge.ts (task resources:merge)
src/Taskfile.yml       tasks of everything above core, included in the root one
src/README.md          every file of src/, what it does and why, with graphs - read it before changing src/
stacks/                the other stacks, each in a place of its own (Q18): python/ (phase 34) the models and simulations, a uv
                       project reading the law through the MCP tools (Law) and asking /api/ask (Mastermind); simulation.py the
                       simulation bubble, proposals.py the improvements proposed (phase 36), transparency.py the declaration of
                       transparency - offices, their places, the state's networks (phase 44); go/ (phase 37) the decentralisation
                       circuits: cmd/pjolseed the torrents of the dataset and the bucket pointed to by IPFS (internal/torrent,
                       bencode, ipfs); cmd/pjolmesh the mirrors on WireGuard, balanced by Traefik (internal/mesh,
                       phase 38); lawchain/ the chain of the law (Cosmos SDK by Ignite, module x/law) and cmd/pjolchain
                       the roots of task seal it records (internal/seal, phase 39) - stacks/go/README.md
scripts/               install.sh, install.bat, the python push - scripts/README.md
  devops/              every step of the workflows as a .sh (pages, release, docs, flow, checks, media), local/ routines behind task flow:*
logs/             a file per run: log-<Date.now()>-<log mode>-<command>.log (LOG_DIR, LOG_LEVEL), ignored by git
tests/            vitest; gather.test.ts runs whole gathering against a local copy of API
  unittesting/    the project on other systems in containers: <system>/<setup>/Dockerfile, cases -<case>/run.sh
resources/        .map.json lists huggingface repositories, their local sides are ignored by git
  dataset/        tables of every source, the training collection: lists/, per <journal>/<year> acts, files, details,
                  references, texts, checkups; sejm/ (terms, processes, prints), SAOS/ (judgments by month)
  bucket/         raw files of every source: <journal>/<year>/<address>.{json,references.json,pdf,html,struct.json,U.pdf},
                  sejm/term<n>/; its README.md is kept in git
  services/       one compose file per service, included by compose.yaml at the root
  configs/        configurations of services, one directory per purpose, in git
    webapp-server/  Dockerfile and start.sh of the slim server image (ghcr.io, the demo space)
    space/          the demo space's Dockerfile and space.env: the release is a build argument, set by each release
    routing-proxy/, internal-dns/, llms-api-host/, log-collector/  settings of those services
    agentic-shell/  the image of the shell for agents (Q13: why it exists, in changelog phase 6)
  locales/        language packs, a submodule - their gist is the source (phase 28): EN-US.json (task i18n:collect) and the others
                  (task i18n:translate), .index.json lists them, EN-US the default; task i18n:pull / i18n:publish
  mediafiles/     the images of the project: the gist MEDIAFILES as a submodule; task resources:media makes
                  icons and og.jpg out of them into src/web/public (the webpage takes them too), docs/assets/images, src/firefox-ext/icons
  torrents/       the torrents of the dataset and the bucket, their index, torrents.car and ROOT (phase 37, task torrents), ignored
  conversations/  the mastermind's conversations, <family>/<instance>/<UNIXUSAT>-<question>.json (phase 31): the local side of the
                  dataset Apokryf/Consiliariis-Polonicum-Lex (.map.json), its README.md (the card) kept in git
  .containerdatavol/  data of containers that stays and is never pushed, a directory per volume, ignored
  secrets/        generated secrets, one file each, ignored; .env wins over them
examples/         Python examples: notebooks/ (Jupyter, the source), marimo/ made from them (ignored), Taskfile; exported
                  into site/examples/ by scripts/devops/examples/build.sh, with the website
webpage/          the React introduction at the root of the website (Vite, own package.json; src/components/ with a p5.js background,
                  its lists in src/data/*.yaml); MkDocs goes under /docs/ - scripts/devops/pages/build.sh
docs/guides/      how to install, gather, check up, move data, gather on a second machine; what it can do (features.md)
docs/mkdocs.yml   the website of the project (MkDocs Material, uv project in docs/), built into site/ - task docs:build
docs/_mkdocs/     its hook: the state on the home page from TODO.md and features.md
docs/glossary/    words of the source and of the project, each with one meaning
docs/.agents/     the agents' own domain (humans read only): NOTES.md (findings, newest on top), ideas.md, things-to-check.md (what waits for a decision
                  or was not verified - keep it current); point-of-view.md is personal
docs/devlog/      the BOS devlog: VISION, ROADMAP, TODO, BRAINSTORM, ORDERS, INQUIRIES, PROPOSALS, scrapnotes
                  (copied into the wiki, on GitHub as milestones, issues and a board - phase 28; what happened
                  said in the discussion of announcements #107 - phase 29)
docs/wiki/        the wiki of GitHub, a submodule: a copy of the devlog and the almanac made by task docs:wiki, never written by hand
docs/almanac/     what was learnt the hard way: cataclistics/ (a case per page, an issue ready for GitHub), solutions/ (a topic
                  each), patterning/ and rulesets/ (JSON, as in BOS), faq.md; a solved problem gets its case here
docs/changelog/   what happened per phase, the owner's words word for word, append-only
.github/          paperwork: CONTRIBUTING, SECURITY, CODE_OF_CONDUCT, SUPPORT, forms of issues, AUTHORS;
                  bos.json (the loop as data), dependabot.yml, workflows/ (gate - every check and scan of a
                  pull request into master, then automerge; checks, codeql, snyk-security, ossar called by it;
                  bots, bots-land, automerge, phase-close, release, devlog, copilot-setup-steps; each that sees
                  steps, a phase closed or a release says it in the discussion #107), copilot-instructions.md
                  and prompts/ (Jarvis's guide); task github:* runs and follows them from a terminal
.obsidian/        the repository is an Obsidian vault; plugins/ holds separate repositories
```

Every directory with procedures has its own `Taskfile.yml` (`.husky`,
`.github`, `resources`), included in the root one.

## Commands

| Command | What it does |
| --- | --- |
| `task` | the launcher: what you want to do (read, gather, process, share, the project), each function asking what it takes; every Taskfile below; a REPL (`task help` lists the tasks) |
| `task do` / `task do -- help acts` / `task do -- acts MP 2025 query=podatek` | every function of the catalog from a shell: their names / what one takes / a reading answered here, or a writing function's task |
| `task functions:map` | `docs/guides/functions.md`: every function and every way the project runs, written from the catalog |
| `task shell` | bash in the `agentic-shell` container, the repository at /workspace, no port (Q13) |
| `task init` | first launch on a machine: tools checked, `.env` from `.env.example`, secrets generated; once |
| `task gather` | lists and metadata of the newest year, every journal |
| `task gather -- 2026 --acts --limit 5` | and all files of 5 acts that miss any |
| `task gather:everything` | all of it, asks before it starts |
| `task gather:changes` | acts changed since the previous such run |
| `task seal` / `task seal -- --check` | write checksums of files without a record / compare files with records |
| `task stats` | the acts counted year by year, by type and status, into `dataset/statistics/acts.json` (the viewer's plots and history) |
| `task map` / `task map -- statutes` | the map of the whole law, every preset or one, into `dataset/map/` (the viewer draws it with sigma.js) |
| `task search:index` (`-- --texts`) | every act into Typesense, started by `docker compose --profile search up -d typesense`; the api and the viewer search every year |
| `task embed` (`-- 2026`) | vectors of the texts by a local multilingual model of Ollama into `dataset/embeddings/` |
| `task compile` / `task text` | tables from raw files / markdown from html (`-- --pdf`: from PDFs too) |
| `task sejm -- 10 --files --limit 50` | processes and prints of a term of Sejm |
| `task eu -- 2016 2024` (`--texts --limit 50`) / `task international` | the law of the EU of years from the Publications Office, the Polish texts of acts in force (phase 42) / the agreements the journals published, indexed |
| `task regional` (`-- POL_WOJ_LB --year 2025 --files`) / `task tenders -- 2026-11-20` | local and regional law: the voivodeships' journals, their acts and PDFs (phase 43) / public tenders of days: e-Zamówienia and TED |
| `task sittings -- 10 --files --limit 40` | the sittings of Sejm: who spoke on each day, then the texts of the statements (phase 35) |
| `task saos -- 2025 --limit 3` | court judgments, 3 months that are not here |
| `task checkup -- 2026 --limit 6` | browser visits websites for acts of a gathered year |
| `task resources:media` | favicons, manifest icons, `og.jpg` and the extension icons made from `resources/mediafiles` (ffmpeg); committed |
| `task resources:space` / `resources:space:refresh` | the space's files from `resources/configs/space` into its local side / its files from git when they differ, its variable `P_JOL_ROLL_VERSION` set to the newest release, built again and waited for (`HF_TOKEN`; the release workflow does it with the space's trusted publisher) |
| `task almanac:recall -- hub:push` / `almanac:judge -- push dataset --actor agent` | cases that began with these events, with solutions / the verdict of the rulesets |
| `task almanac:issues` / `almanac:issues:open -- <id>` | the cases with their issues / one opened on GitHub, closed when solved (the owner's) |
| `task i18n:collect` / `task i18n:translate` | the English of the built pages into `resources/locales/EN-US.json` / the other packs by argostranslate |
| `task i18n:pull` / `task i18n:publish -- "..."` | the packs from their gist (the submodule `resources/locales`) / the packs changed here committed and pushed there, the submodule staged |
| `task resources:merge` | the directories sources had before phase 10 moved into the one dataset and bucket |
| `task resources:plan -- dataset` | what differs between local side and huggingface |
| `task resources:pull -- dataset` / `push` / `prune` | take what is missing here / send what is new here / delete there what is not here (asks; never the bucket) |
| `task unittesting:parrot-os` / `parrot-os-drive` | Parrot OS headless server in a container: case `-gather-and-parse` / `-bare-repo-on-drive` (privileged; needs Docker) |
| `task flow:land -- "..."` / `flow:sync` | every check (`task check`), then your `dev/<name>` into `development`, both pushed / `origin`, `master` and your branch brought together |
| `task flow:phase-close -- <n>` | a done phase: Y bumped and the pull request to `master`, by a workflow; its gate merges it when everything passes |
| `task github:run -- <workflow>` / `github:gate -- <pr>` / `github:pending` / `github:checks -- <pr>` | a workflow started from here (on development; `--ref`, `-f key=value`) / the gate of a pull request into master again / runs waiting for approval (`-- --approve`) / the checks of a pull request - no website needed |
| `task github:devlog` (`-- --dry`) / `task docs:wiki` | the devlog on GitHub: milestones of ROADMAP, an issue per phase, `Q<n>` and `PP<n>`, the board (the workflow `devlog.yml` does it but the board on each push of the devlog) / the devlog and the almanac copied into the wiki (submodule `docs/wiki`), pushed, the submodule staged |
| `task github:announce -- --dry steps <before> <after>` | what the workflows say in the discussion of announcements (#107): `steps <before> <after>`, `staging <phase> <pr>`, `release <tag>`; `--dry` prints it |
| `task version:sync` | every version field written from `package.json` (also done by each bump) |
| `task lint` / `task format` | Biome, check only / with fixes |
| `task serve` / `task mcp` | http api with the website and MCP at `/mcp` on 127.0.0.1:8080 / MCP server over stdio, both read-only (`task mcp:ask` asks it); `task serve -- --allow-writing`: the viewer starts writing functions too, each after a yes (this machine only) |
| `task agent -- "..."` / `agent:container -- "..."` | the executive agent (phase 33): qwen does a task through the MCP tools and writes only into `resources/agent/`; here with the host's Ollama / in the agents' shell (`AGENT_ENGINE=opencode` for opencode 2) |
| `task mastermind:compare` (`-- gemma bielik`) | every team of `resources/configs/mastermind/families.yaml` asked the same questions (`questions.yaml`), each conversation kept; `MASTERMIND_TEAM=gemma task mastermind:ask -- "..."` one team |
| `task mastermind:ask -- --escalate "..."` / `-- --hard "..."` | the advanced strategy (phase 34): a weak answer of the host's model goes on to `deepseek-ai/DeepSeek-R1-0528` through Inference Providers, on `HF_TOKEN` / straight there; `/api/ask?escalate=1` / `hard=1` |
| `task torrents` (`-- -only dataset`, `-dry`) / `torrents:publish` | the dataset and the bucket as torrents with web seeds on Hugging Face, their IPFS directory (CIDs offline, `torrents.car`) in `resources/torrents/` (phase 37) / the owner's: put on IPFS by the node of compose (profile `ipfs`); `task go:check` the Go stack |
| `task mirror:list` / `mirror:keys -- <mirror>` / `mirror:up -- <mirror>` / `mirror:down` | the mirrors of the law (phase 38, `resources/configs/mirrors/mirrors.yaml`) / this machine's WireGuard keys, the public one into the registry / its WireGuard and Traefik made, the profile `mirror` of compose up (site on :8095) / stopped; `task unittesting:mirrors` two mirrors with a real tunnel, in containers |
| `task chain:build` / `chain:seal -- <key>` / `go:roots` | the chain of the law (phase 39): lawchaind built / the roots of the years sealed here recorded by this mirror (asks first) / the roots shown; `task unittesting:chain` a chain of one mirror for real; profile `chain` of compose a mirror's node |
| `task sign:verify -- act.pdf` | a file signed with a FIDO key by the desktop app (phase 40) checked against its `.sig.json`, offline (`src/core/signing/`) |
| `task analyse` | the code of law analysed (phase 36): every act in force against its ties - a basis repealed, a reference to a repealed act, a consolidated text due, a Tribunal's judgment not followed - into `dataset/analysis/`; local tables only |
| `task python:simulate -- DU/1997/939` / `python:propose -- DU/1997/939` | the simulation bubble: invented people talk about an act in rounds, models of the host's Ollama (`resources/simulations/`) / improvements proposed by a model from the act, its findings, debates and simulations (`resources/proposals/`) - docs/guides/analysis.md |
| `task python:offices` / `python:geocode -- --limit 3000` / `python:networks` | the declaration of transparency (phase 44): the public offices' official contacts from dane.gov.pl / their places from Nominatim, cached / the state's networks in RIPE - docs/guides/transparency.md |
| `task python:check` / `python:law -- act DU/1918/2` | the Python stack (`stacks/python/`): ruff and pytest / the law through it (`tools`, `act`, `text`, `nearest`, `ask`) |
| `task ollama:serve` / `ollama:copy` / `ollama:where` | the Ollama of this machine from its own drive (`OLLAMA_MODELS` of `.env`): the models of `~/.ollama/models` copied there first, then served / copied again, checked / where they are |
| `task mastermind:ask -- "..."` / `mastermind:up` / `mastermind:down` | a question to the law mastermind: the host's Ollama reads the acts through MCP and cites them by ELI (`-- --json` all of it) / the same as containers for another machine (compose profile `mastermind`: Ollama, its models, the api with `/api/ask` on :8081; the GPU when there is one) / stopped |
| `task workflows:build` / `workflows:serve` | durable runs on 127.0.0.1:8090 |
| `task workflows:daily` / `workflows:approve -- <token>` | one daily run that waits for you / your answer |
| `task examples:build` / `examples:edit` | the Python examples run and exported into `site/examples/` / opened in marimo |
| `task docs:build` / `docs:serve` | the website of the project into `site/` / live preview |
| `task devlog:state` / `devlog:scrapnote` | where the project stands (the `bos` command) / a new scrapnote |
| `task web:build` / `task desktop` | website into `dist/web` / Electron window around it |
| `task check` (or `task verify`) | Biome, build (TypeScript and website), tests — the same in CI; run before a commit is reported done, and by the pre-push hook |

## Conventions

- Tabs for indentation (Biome), except `package.json`. Double quotes.
- Short file names. Data and addresses stay out of handlers.
- No flat scope: a new file goes into the directory of its kind under
  `src/core/` (or a new directory when it is a new kind), not next to
  `main.ts`. The same holds for docs, tests and resources as they grow.
- Types and interfaces are not declared next to code. Each has its own file
  in `src/core/vars/types/` or `src/core/vars/interfaces/` (default export,
  no directories inside), is added to a namespace in the `index.ts` there,
  and is used through it: `GatheringScope.Act`. Namespaces only in indexes.
- A gathered file appears under its name only when it is complete (`.part`
  first), so an interrupted run can be repeated and takes what is missing.
- What is gathered is known from files and from records in `dataset/files/`.
  Nothing is resumed from `storage/`; queues of requests live in memory.
- Names of files come from answers of APIs and are checked before use.
- Tests never touch the real API. `ELI_API`, `SEJM_API`, `SAOS_API` and
  `RESOURCES_DIR` in environment point the code at a copy.

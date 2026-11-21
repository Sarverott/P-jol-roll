# P_JOL_ROLL

Polish **Journals of Laws resources operational lurker loader** - complex set of tools to handle datamining, crawling and parsing of all law documents released as published by polish goverment national legal code, package of approved acts or available constitution version

In plain steps: it takes every act published in **Dziennik Ustaw** (since
1918) and **Monitor Polski** (since 1930) from the open
[ELI API of Sejm](https://api.sejm.gov.pl/eli/openapi/), keeps the raw files
and tables of them, checks every file by its checksum, turns the texts into
markdown, ties acts to each other, and shows it all through an api, a
website and an MCP server for AI agents. The far goal: an open
**devil's advocate for every person**, built on the whole written law.

Nothing here is legal advice. See [what the data is and is not](docs/guides/data.md#what-it-is-not).

### repositories related with this one

- on HuggingFace 
    - S3 Bucket with raw docs: https://huggingface.co/buckets/Sarverott/raw-law-of-poland
    - Dataset with markdown-parsed docs with content and without trash: https://huggingface.co/datasets/Sarverott/polish_national_law_docs
    - presenting demo space to preview docs: https://huggingface.co/spaces/Sarverott/docs-of-law-by-gov-in-poland

## Getting started

You need Node.js 24 and npm 11 (`.nvmrc`), git, and about 1 GB of disk for
dependencies and the browser of `checkup`. [Task](https://taskfile.dev)
comes with the dependencies as `npx task`.

```sh
git clone --recurse-submodules https://github.com/Sarverott/P-jol-roll.git
cd P-jol-roll && npm install        # also downloads the browser and sets up git hooks
task init                           # once: tools checked, .env from .env.example, secrets
task verify                         # checks, build, tests - nothing asks the internet
task gather -- 2026 --acts --limit 5   # a small gathering: listing of 2026, files of 5 acts
task compile && task text           # tables and markdown from what was gathered
task web:build && task serve        # the viewer on http://127.0.0.1:8080
```

What lands where: tables in `resources/dataset/`, raw files in
`resources/bucket/`, both ignored by git; their repositories on Hugging Face
are named in `resources/.map.json`.

Before the big run (`task gather:everything`, hundreds of thousands of
requests, days of work) read [gathering](docs/guides/gathering.md): the
source is open, and the gatherer is polite to it by design.

## What it can do

The whole list, each function marked *works*, *built* or *wanted*:
[docs/guides/features.md](docs/guides/features.md). In short:

| Part | Commands |
| ---- | -------- |
| Gathering from the ELI API, the work of Sejm, court judgments | `task gather`, `gather:changes`, `sejm`, `saos` |
| Checksums, tables, markdown | `task seal`, `compile`, `text` |
| Moving data to and from Hugging Face | `task resources:plan`, `push`, `pull` |
| Reading: api, website, MCP, desktop window, extension | `task serve`, `web:build`, `mcp`, `desktop`, `extension` |
| Durable daily runs that wait for your "yes" | `task workflows:serve`, `workflows:daily` |

`task --list` shows every task with one line each.

## Read on

| For | Read |
| --- | ---- |
| using it | [the guides](docs/README.md): installation, gathering, processing, other sources, Hugging Face, the data |
| the code | [src/README.md](src/README.md): every file, with graphs |
| words of the source and of the project | [glossary](docs/glossary/README.md) |
| the plan and its questions | [devlog](docs/devlog/README.md): VISION, ROADMAP, TODO, BRAINSTORM |
| contributing | [CONTRIBUTING](.github/CONTRIBUTING.md); agents read [AGENTS.md](AGENTS.md) |

## The workshop

P_JOL_ROLL is a project of the [Blacksmith Organization System](https://github.com/Sarverott/blacksmith-organization-system)
workshop: work happens on `development` and on each contributor's
`dev/<name>`, one finished step per conventional commit, phases planned in
[docs/devlog/TODO.md](docs/devlog/TODO.md); `master` moves only through a
pull request.

Licensed [AGPL-3.0-only](LICENSE).

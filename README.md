# P_JOL_ROLL

[![P_JOL_ROLL___BANNER_IMAGE](https://gist.githubusercontent.com/Sarverott/025bda4b967642107b88345c0e465b1a/raw/6cf448f5ef52a55ba8efb94e6d95e65f4df4954d/p-jol-roll_edited-color.png)](https://sarverott.github.io/P-jol-roll/)

Polish **Journals of Laws resources operational lurker loader** - complex set of tools to handle datamining, crawling and parsing of all law documents released as published by polish goverment national legal code, package of approved acts or available constitution version

In plain steps: it takes every act published in **Dziennik Ustaw** (since
1918) and **Monitor Polski** (since 1930) from the open
[ELI API of Sejm](https://api.sejm.gov.pl/eli/openapi/), keeps the raw files
and tables of them, checks every file by its checksum, turns the texts into
markdown, ties acts to each other, and shows it all through an api, a
website and an MCP server for AI agents. The far goal: an open
**devil's advocate for every person**, built on the whole written law.

Not (formally) legal advices. See [what the data is and is not](docs/guides/data.md#what-it-is-not).

## Links

- **Introduction** (the website of the project, GitHub Pages): https://sarverott.github.io/P-jol-roll/
- **Demo** (browse the acts, Hugging Face space): https://huggingface.co/spaces/Sarverott/docs-of-law-by-gov-in-poland
- **Bucket** (raw files of every act): https://huggingface.co/buckets/Sarverott/raw-law-of-poland
- **Dataset** (tables and markdown of the acts): https://huggingface.co/datasets/Sarverott/polish_national_law_docs
- **Podcasts about the project**, 12 languages, on Google Drive: [the whole folder](https://drive.google.com/drive/folders/1yklwKu-k9AXvT_CJlFhjhtmbaY3VSD7k)
    - PL (Polski): [P-jol-roll uczy AI polskiego prawa](https://drive.google.com/file/d/1yTeUXJgW3X8Y0A5nsNUuvsHuzLRexGQU/view)
    - EN (English): [Reverse Engineering Polish Law for AI](https://drive.google.com/file/d/13MJHVm9r9u-rqBwDg-bPdhVRM2DNXEgf/view)
    - DE (Deutsch): [Ein Entwickler macht Polens Rechtssystem KI-bereit](https://drive.google.com/file/d/1ooqmwBEpH2N_Q03VxA4-2hyegdwk9rfz/view)
    - ES (Español): [Estructurar las leyes polacas para IA](https://drive.google.com/file/d/1SfJLPqWTQYtmG2ksY2EDz0G4o1QqjvyY/view)
    - FR (Français): [Un développeur solo structure les lois polonaises](https://drive.google.com/file/d/1te4lCq1cIff1Eg9Ax0DQfIl_U7Baatqq/view)
    - IT (Italiano): [Tradurre le leggi per l'intelligenza artificiale](https://drive.google.com/file/d/1TBdDWgaSRzSSLCv9eRvKQ_GQ22lWJFJM/view)
    - RO (Română): [Un programator digitalizează legile Poloniei pentru AI](https://drive.google.com/file/d/1B04JWltBs2KzHRLKK55EZKKg7RvxkVu_/view)
    - HU (Magyar): [Lengyel törvények átalakítása AI adattá](https://drive.google.com/file/d/100gjWNfmT7XcQyVNjc9MswP2-Gdx2P_y/view)
    - TR (Türkçe): [Polonya Yasalarını Temizleyen P-jol-roll Projesi](https://drive.google.com/file/d/1b9yQ7pevJzXPprKSLH9vo9hNuygXbcik/view)
    - RU (Русский): [Как оцифровать законы Польши для ИИ](https://drive.google.com/file/d/1RmheRvm5LlFRk2mMDZipkeO0M6_JUXHQ/view)
    - JA (日本語): [難解な政府法律PDFをAI用マークダウンに変換](https://drive.google.com/file/d/1pGLBfUQqTdaYW4IGUZFGPrYEQGaunJGd/view)
    - KO (한국어): [국가 법률 PDF를 해체한 1인 개발자](https://drive.google.com/file/d/1mIhxodV9kDpCMHYdz6DXSJTgvU01lWl3/view)
- **Examples** (using it from Python: notebooks, marimo, run with the website): https://sarverott.github.io/P-jol-roll/examples/ - source in [examples/](examples/)
- **Documentation** (Read the Docs): https://lex-polonica.readthedocs.io/
- **Code**: https://github.com/Sarverott/P-jol-roll (mirrors on GitLab and Bitbucket later)

### Known references to this project by third party sources

> **DISCLAIMER:** these pages are made by other people's services, mostly
> by machines, from this repository as it is. The project does not check
> them and is not responsible for their mistakes; none of it is legal
> advice.

- [GitIngest](https://gitingest.com/sarverott/p-jol-roll) - the repository as one text, for a language model
- [DeepWiki](https://deepwiki.com/Sarverott/P-jol-roll) - a wiki written by AI
- [GitMCP](https://gitmcp.io/Sarverott/P-jol-roll) - the repository as an MCP server (the project's own MCP server reads the gathered law: `task mcp`)
- [GitDiagram](https://gitdiagram.com/Sarverott/P-jol-roll) - a diagram of the code drawn by AI
- [github.dev](https://github.dev/Sarverott/P-jol-roll) - the code in an editor in the browser (GitHub's own)

## Getting started

You need Node.js 24 and npm 11 (`.nvmrc`), git, and about 1 GB of disk for
dependencies and the browser of `checkup`. [Task](https://taskfile.dev)
comes with the dependencies as `npx task`.

```sh
git clone --recurse-submodules https://github.com/Sarverott/P-jol-roll.git
cd P-jol-roll && npm install        # also downloads the browser and sets up git hooks
task init                           # once: tools checked, .env from .env.example, secrets
task                                # the launcher: every way to run it, in a menu
task verify                         # checks, build, tests - nothing asks the internet
task gather -- 2026 --acts --limit 5   # a small gathering: listing of 2026, files of 5 acts
task compile && task text           # tables and markdown from what was gathered
task web:build && task serve        # the viewer on http://127.0.0.1:8080
```

What lands where: tables of every source in `resources/dataset/` (the
journals, `sejm/`, `SAOS/`), raw files in `resources/bucket/` (`DU/`, `MP/`,
`sejm/`), both ignored by git; their repositories on Hugging Face are named
in `resources/.map.json`.

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

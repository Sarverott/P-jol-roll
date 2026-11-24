# Functions

Every function of the project and every way it runs - written by
`task functions:map` from the catalog (`src/core/catalog/procedures.ts`),
so do not edit it by hand. The launcher (bare `task`), its REPL and
`task do` offer every function; the other ways where a cell names how. A
writing function (✎) is started by the viewer and the api only on this
machine, when the api runs with `--allow-writing` (the desktop app does),
each after a person's yes; a public host shows it disabled (Q19). `–` is a hole.

| Function | | launcher, REPL, `task do` | viewer | api | MCP | CLI | extension | workflows |
| -------- | - | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| **read the law** | | |  |  |  |  |  |  |
| `journals` journals gathered here, with their years |  | ✓ | `#acts` | `GET /api/journals` | `journals` | – | – | – |
| `acts` acts of a year, by words of their titles |  | ✓ | `#acts` | `GET /api/acts/{journal}/{year}` | `search_acts` | – | – | – |
| `meaning` acts of every year nearest in meaning to a question (the vectors of task embed, Ollama) |  | ✓ | – | – | `search_meaning` | – | – | – |
| `act` one act: its line of the listing, details and the files gathered |  | ✓ | `#act/DU/2026/1` | `GET /api/acts/{journal}/{year}/{pos}` | `act` | – | `the popup` | – |
| `act-text` the text of an act, as markdown |  | ✓ | `#act/DU/2026/1` | `GET /api/acts/{journal}/{year}/{pos}/text` | `act_text` | – | – | – |
| `act-ties` ties of an act to other acts, as a list or a mermaid flowchart |  | ✓ | `#act/DU/2026/1` | `GET /api/acts/{journal}/{year}/{pos}/references` | `act_references` | – | – | – |
| `search` words in titles and texts of every year (Typesense must run) |  | ✓ | `#acts` | `GET /api/search` | – | – | – | – |
| `maps` maps of the whole law: the presets, and which are made |  | ✓ | `#map` | `GET /api/map` | – | – | – | – |
| `statistics` the acts counted year by year: total, by type, by status |  | ✓ | `#statistics` | `GET /api/statistics` | `statistics` | – | – | – |
| `lists` lists of the source: statuses, types, institutions, keywords |  | ✓ | `#data` | `GET /api/lists/{name}` | `source_list` | – | – | – |
| `sejm-work` legislative processes and prints of a term of Sejm |  | ✓ | `#data` | `GET /api/sejm/{term}/{kind}` | `sejm_work` | – | – | – |
| `judgments` court judgments of SAOS, a month at a time |  | ✓ | `#data` | `GET /api/judgments/{year}/{month}` | – | – | – | – |
| **gather from the sources** | | |  |  |  |  |  |  |
| `gather` lists and acts of the years, and the files of acts that miss any | ✎ | ✓ `task gather` | local, after a yes | `POST /api/jobs` (local) | – | `npm start -- gather` | – | `daily` |
| `gather:changes` acts changed since the previous such run, or since a day | ✎ | ✓ `task gather:changes` | local, after a yes | `POST /api/jobs` (local) | – | `npm start -- gather --since last` | – | `daily` |
| `gather:everything` every journal, every year, every file - days of work | ✎ | ✓ `task gather:everything` | local, after a yes | `POST /api/jobs` (local) | – | `npm start -- gather --all --acts --limit 0` | – | – |
| `sejm` work of Sejm: processes and prints of terms | ✎ | ✓ `task sejm` | local, after a yes | `POST /api/jobs` (local) | – | `npm start -- sejm` | – | – |
| `saos` court judgments of SAOS, months of years | ✎ | ✓ `task saos` | local, after a yes | `POST /api/jobs` (local) | – | `npm start -- saos` | – | – |
| `checkup` a browser visits the websites that show acts of a year | ✎ | ✓ `task checkup` | local, after a yes | `POST /api/jobs` (local) | – | `npm start -- checkup` | – | – |
| **process what is gathered** | | |  |  |  |  |  |  |
| `seal` checksums of gathered files: write the missing, or check them all | ✎ | ✓ `task seal` | local, after a yes | `POST /api/jobs` (local) | – | `npm start -- seal` | – | `daily` |
| `compile` tables of details and references from the raw files | ✎ | ✓ `task compile` | local, after a yes | `POST /api/jobs` (local) | – | `npm start -- compile` | – | `daily` |
| `text` markdown of the acts from html (and from PDFs) | ✎ | ✓ `task text` | local, after a yes | `POST /api/jobs` (local) | – | `npm start -- text` | – | `daily` |
| `map` the map of the whole law, every preset or one | ✎ | ✓ `task map` | local, after a yes | `POST /api/jobs` (local) | – | `npm start -- map` | – | – |
| `stats` the acts counted into the dataset, for the demo | ✎ | ✓ `task stats` | local, after a yes | `POST /api/jobs` (local) | – | `npm start -- stats` | – | – |
| `search:index` every act into Typesense, for the search of every year | ✎ | ✓ `task search:index` | local, after a yes | `POST /api/jobs` (local) | – | `npm start -- search index` | – | – |
| `embed` vectors of the texts by a local model of Ollama | ✎ | ✓ `task embed` | local, after a yes | `POST /api/jobs` (local) | – | – | – | – |
| `i18n:collect` the English words of the built pages into the language pack | ✎ | ✓ `task i18n:collect` | local, after a yes | `POST /api/jobs` (local) | – | – | – | – |
| `i18n:translate` the other language packs, by argostranslate | ✎ | ✓ `task i18n:translate` | local, after a yes | `POST /api/jobs` (local) | – | – | – | – |
| **Hugging Face and the demo** | | |  |  |  |  |  |  |
| `resources:plan` what differs between here and Hugging Face |  | ✓ `task resources:plan` | – | – | – | `npm start -- hub plan` | – | – |
| `resources:pull` take what is on Hugging Face and not here | ✎ | ✓ `task resources:pull` | local, after a yes | `POST /api/jobs` (local) | – | `npm start -- hub pull` | – | – |
| `resources:push` send what is new here to Hugging Face (HF_TOKEN) | ✎ | ✓ `task resources:push` | local, after a yes | `POST /api/jobs` (local) | – | `npm start -- hub push` | – | `daily, after a yes` |
| `resources:space:refresh` the demo space set to the newest release and built again | ✎ | ✓ `task resources:space:refresh` | local, after a yes | `POST /api/jobs` (local) | – | – | – | `release` |
| **the project itself** | | |  |  |  |  |  |  |
| `init` first launch on this machine: tools, .env, secrets | ✎ | ✓ `task init` | local, after a yes | `POST /api/jobs` (local) | – | – | – | – |
| `check` every check: Biome, the build, the tests |  | ✓ `task check` | – | – | – | – | – | `checks` |
| `serve` the api with the website and MCP on 127.0.0.1:8080 |  | ✓ `task serve` | – | – | – | – | – | – |
| `desktop` the desktop window around the viewer |  | ✓ `task desktop` | – | – | – | – | – | – |
| `devlog:state` where the project stands, into STATE.md | ✎ | ✓ `task devlog:state` | local, after a yes | `POST /api/jobs` (local) | – | – | – | – |
| `almanac:recall` cases of the almanac that began with these events, and their solutions |  | ✓ `task almanac:recall` | – | – | – | – | – | – |

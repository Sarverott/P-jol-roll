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
| `analysis` the code of law analysed: findings over every act in force, or of one act |  | ✓ | `#act/DU/2026/1` | `GET /api/analysis, /api/acts/{journal}/{year}/{pos}/findings` | `analysis` | – | – | – |
| `eu-law` the law of the EU: an act by its CELEX, or the acts of a year (phase 42) |  | ✓ | – | `GET /api/eu, /api/eu/{year}, /api/eu/act/{celex}` | `eu_law` | – | – | – |
| `agreements` international agreements binding Poland, published in the journals (phase 42) |  | ✓ | – | `GET /api/agreements` | `agreements` | – | – | – |
| `regional-law` local and regional law: a voivodeship journal's acts of a year (phase 43) |  | ✓ | – | `GET /api/regional, /api/regional/{code}/{year}` | `regional_law` | – | – | – |
| `public-tenders` public tenders of a day: e-Zamówienia (BZP) or TED (phase 43) |  | ✓ | – | `GET /api/tenders/{source}/{day}` | `tenders` | – | – | – |
| `transparency` the declaration of transparency: public offices' contacts and places, the state's networks (phase 44) |  | ✓ | – | `GET /api/transparency/{of}` | `transparency` | – | – | – |
| `act-debates` an act in Sejm: the days its bill was read on, who said what |  | ✓ | `#act/DU/2026/1` | `GET /api/acts/{journal}/{year}/{pos}/debates` | `act_debates` | – | – | – |
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
| `eu` the law of the EU: every act of years, the Polish texts of those in force (phase 42) | ✎ | ✓ `task eu` | local, after a yes | `POST /api/jobs` (local) | – | `npm start -- eu` | – | – |
| `regional` the voivodeships' official journals: local and regional law (phase 43) | ✎ | ✓ `task regional` | local, after a yes | `POST /api/jobs` (local) | – | `npm start -- regional` | – | – |
| `tenders` public tenders of days: e-Zamówienia and TED (phase 43) | ✎ | ✓ `task tenders` | local, after a yes | `POST /api/jobs` (local) | – | `npm start -- tenders` | – | – |
| `sittings` sittings of Sejm: who spoke on each day, and what (phase 35) | ✎ | ✓ `task sittings` | local, after a yes | `POST /api/jobs` (local) | – | `npm start -- sittings` | – | – |
| `saos` court judgments of SAOS, months of years | ✎ | ✓ `task saos` | local, after a yes | `POST /api/jobs` (local) | – | `npm start -- saos` | – | – |
| `checkup` a browser visits the websites that show acts of a year | ✎ | ✓ `task checkup` | local, after a yes | `POST /api/jobs` (local) | – | `npm start -- checkup` | – | – |
| **process what is gathered** | | |  |  |  |  |  |  |
| `international` the international agreements the journals published, indexed (phase 42) | ✎ | ✓ `task international` | local, after a yes | `POST /api/jobs` (local) | – | `npm start -- international` | – | – |
| `analyse` the code of law analysed: every act in force against its ties (phase 36) | ✎ | ✓ `task analyse` | local, after a yes | `POST /api/jobs` (local) | – | `npm start -- analyse` | – | – |
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
| `torrents` the dataset and the bucket as torrents, with their IPFS directory, made here (phase 37) | ✎ | ✓ `task torrents` | local, after a yes | `POST /api/jobs` (local) | – | – | – | – |
| `mirror:up` this machine as a mirror of the law: WireGuard, the api, Traefik (phase 38) | ✎ | ✓ `task mirror:up` | local, after a yes | `POST /api/jobs` (local) | – | – | – | – |
| `report:draft` reports to the authorities drafted from the problems found (phase 45) | ✎ | ✓ `task report:draft` | local, after a yes | `POST /api/jobs` (local) | – | – | – | – |
| `report:send` one report sent, after a person's yes (phase 45) | ✎ | ✓ `task report:send` | local, after a yes | `POST /api/jobs` (local) | – | – | – | – |
| `sign:verify` a file signed with a FIDO key by the desktop app, checked (phase 40) |  | ✓ `task sign:verify` | – | – | – | – | – | – |
| `torrents:publish` the torrents put on IPFS: the node of compose started, imported, pinned | ✎ | ✓ `task torrents:publish` | local, after a yes | `POST /api/jobs` (local) | – | – | – | – |
| **the project itself** | | |  |  |  |  |  |  |
| `init` first launch on this machine: tools, .env, secrets | ✎ | ✓ `task init` | local, after a yes | `POST /api/jobs` (local) | – | – | – | – |
| `check` every check: Biome, the build, the tests |  | ✓ `task check` | – | – | – | – | – | `checks` |
| `serve` the api with the website and MCP on 127.0.0.1:8080 |  | ✓ `task serve` | – | – | – | – | – | – |
| `desktop` the desktop window around the viewer |  | ✓ `task desktop` | – | – | – | – | – | – |
| `devlog:state` where the project stands, into STATE.md | ✎ | ✓ `task devlog:state` | local, after a yes | `POST /api/jobs` (local) | – | – | – | – |
| `almanac:recall` cases of the almanac that began with these events, and their solutions |  | ✓ `task almanac:recall` | – | – | – | – | – | – |

# What P_JOL_ROLL can do

Every function of the project, with how sure we are that it works. Updated
with the work; the plan for what is missing is in
[the devlog](../devlog/TODO.md), older ideas in
[ideas](../.agents/ideas.md).

| Mark | Means |
| ---- | ----- |
| **works** | used on real data, or checked end to end against a local copy of the source; how is said |
| **built** | written and covered by tests or a smoke run, never used on the real thing |
| **wanted** | asked for or planned, not built |

State of 2026-11-13.

## Gathering

| Function | Command | State |
| -------- | ------- | ----- |
| Lists and listings of every year, both journals (DU, MP) | `task gather -- --all` | **works**: the owner's machine listed all 164,638 acts in October 2026 |
| Files of acts: details, references, PDF, HTML | `task gather -- 2026 --acts --limit 5`, `task gather:everything` | **works**: DU 1918-1933 and part of 2026 gathered (34,482 files, 10 GB); the rest is being gathered on the external machine |
| Structure of a text, other texts (`U`, `T`) of an act | parts `struct`, `texts` of `gather` | **built**: tests and one real request each for the shape |
| Interrupt and start again, nothing asked twice | Ctrl+C, then the same command | **works**: files appear only when whole; checksum records say what is here |
| Daily changes | `task gather:changes` | **built**: tests against a local copy; one real request for the shape |
| Checksum records of every file | `task seal`, `task seal -- --check` | **works**: run over the 34,482 real files into a scratch directory, 0 differ |
| Work of Sejm: processes, prints | `task sejm -- 10 --files --limit 50` | **built**: tests; one real request per address |
| Court judgments of SAOS | `task saos -- 2025 --limit 3`, `task saos -- --quality` | **works again** (phase 41): SAOS refused every page with 406 until the crawler asked for JSON; `--quality` keeps the judgments it dates after today or before 1918 apart - 5 on 2026-11-24 |
| Websites that show acts, visited by a browser | `task checkup -- 2026 --limit 6` | **built**: run against a local page only |
| The sittings of Sejm: who spoke on each day, and what | `task sittings -- 10 --files` | **built**: tests against a copy of the API; not run against the source here (the owner starts gathering) |
| An act's debates: the days its bill was read on, the statements naming its print | the act's page, `/api/acts/.../debates`, MCP `act_debates` | **built**: tests; shows the processes and stages already gathered on this machine, the statements once `task sittings` has run |
| Votings, interpellations of Sejm | | **wanted** |
| Open data portal, court register, statistics, national bank | | **wanted** (looked at, see [ideas](../.agents/ideas.md)) |
| European law | | **wanted**, put off by the owner |

## Processing

| Function | Command | State |
| -------- | ------- | ----- |
| Tables of details and references, the graph of ties | `task compile` | **works**: real files of 1918-1933 into a scratch directory, 45,658 ties of 11,008 acts |
| Markdown from HTML, with checksums of both | `task text` | **works** on acts of 1918-1933 (1,464 files); newer HTML and tables not seen |
| Markdown from PDFs of acts without HTML, scans listed | `task text -- --pdf` | **works** on DU 1953 (261 acts) and MP 2021 (1206); not run over the whole bucket |
| Markdown from PDF (three quarters of acts have only a PDF) | | **wanted** |
| Texts by article, unified texts preferred | | **wanted** |
| A dataset for training a model; an advisor agent | | **wanted** (the far goal) |

## Keeping and moving

| Function | Command | State |
| -------- | ------- | ----- |
| Compare local data with Hugging Face | `task resources:plan -- dataset` | **works**: run by the owner |
| Send or take only what differs | `task resources:push` / `pull -- dataset` | **built**: never run by an agent (sending is the owner's move) |
| Daily run that waits for "yes" before pushing | `task workflows:daily`, `workflows:approve` | **built**: end to end against a local copy, with "no" and with no answer; Q9 asks whether to keep it |
| Gathering on a second machine | [second machine](second-machine.md); `RESOURCES_DIR` in `.env` | **built**: the guide and `.env` for every task; the trouble on Parrot OS waits for its error (Q1) |

## Reading and showing

| Function | Command | State |
| -------- | ------- | ----- |
| Http api with OpenAPI description and live notices | `task serve` | **works**: tests, and a browser over the real listings |
| Website: the viewer of acts | `task web:build`, then `task serve` | **works**: headless browser over the real listings (list, act, PDF link) |
| Search over every year (Typesense): titles, keywords, beginnings of texts, filters by type and status | `task search:index`, `/api/search`, the viewer's "every year" | **works**: 165,006 acts indexed in 10 s (20 s with texts, 444 MB in memory); headless browser searched, filtered, saw the marked words |
| The viewer, the introduction and the documentation in Polish, Ukrainian and German and the launcher, the REPL and the task descriptions (packs of `resources/locales/`, 1583 texts) | `?lang=PL-PL` or the switch; `/docs/pl-pl/`; `P_JOL_ROLL_LANG=PL-PL task` | **works**: headless browser, data and code untouched, back to English without reload; the packs are machine translations, not read by a person |
| Vectors of texts by a local multilingual model (Ollama, bge-m3) | `task embed` | **works**: DU 2020 in a copy, 2453 vectors in 1 min 46 s; a second run kept them all |
| Search by meaning in any language (Typesense hybrid, the question by the same model) and a map by meaning | `/api/search?meaning=1`, the viewer's "by meaning"; `task map -- statutes-in-force-by-meaning` | **works** on DU 2020 in a copy: an English question found Polish acts; 63 statutes tied to their nearest |
| The map of the whole law (sigma.js), from presets | `task map`, the viewer's tab | **works**: three presets made from the real dataset in 53 s (0.4-2.8 MB); headless browser draws them, hover and click checked |
| Ties of an act drawn (mermaid, one drawing for api, MCP and viewer) and a minimap of them (Cytoscape.js) | `/api/acts/<eli>/diagram`, the viewer | **works**: headless browser over DU 2020, a click on a node opens that act |
| Signing a PDF with a FIDO key, checked offline | the window's menu, the tray, `task sign:verify` | **built**: signed and verified with a security key simulated by Chromium; the app starts with its window at localhost; a real key on USB not tried here |
| A label of an act for a Bluetooth sticker printer; the act for a phone as a QR code | the window's menu, the tray | **built**: the label's ESC/POS bytes tested; no printer tried here |
| The chain of the law: the mirrors agree on the roots of `task seal` by Cosmos SDK | `task chain:build`, `task chain:seal`, `lawchaind query law agreement` | **works** on one machine: the module's tests with four mirrors, a chain of one mirror started for real (a year sealed and agreed, a stranger refused); the image builds; no network of mirrors has had its genesis yet |
| Mirrors of the law on a WireGuard network, balanced by Traefik | `task mirror:up -- <mirror>`, `task unittesting:mirrors` | **works** in containers: two mirrors with a real WireGuard tunnel, Traefik answering from both, keys equal to `wg pubkey`'s; the profile `mirror` with the real api not started here; no mirror runs on a machine of a voivodeship yet |
| The dataset and the bucket as torrents pointed to by IPFS | `task torrents`, `task torrents:publish` | **works** for the dataset: 12 torrents of 4.6 GB in 18 s, a torrent's pieces checked by an independent reader, every CID equal to kubo's, the CAR imported by kubo; the bucket's 189 GB not hashed here; not published (the owner's move) |
| The law of the EU binding Poland: every act of a year, Polish titles and texts | `task eu -- 2024`, MCP `eu_law`, `/api/eu` | **works**: 2024's listing taken here (3,765 acts, 2,310 in force); texts tested against a stand-in, not taken from the source here |
| International agreements published in the journals | `task international`, MCP `agreements`, `/api/agreements` | **works**: 9,480 indexed from the listings here |
| Local and regional law: the voivodeships' official journals | `task regional`, MCP `regional_law`, `/api/regional` | **works** for ten of sixteen: Lublin's 2026 taken here (5,635 acts); the other six refused (certificates, a timeout, another platform) |
| Public tenders: e-Zamówienia and TED, by day | `task tenders`, MCP `tenders`, `/api/tenders` | **built**: tested against stand-ins (a full window split); the real run met e-Zamówienia's firewall (403) once - now polite and waiting it out |
| The declaration of transparency: public offices' contacts and places, the state's networks | `task python:offices`, `python:geocode`, `python:networks`, MCP `transparency` | **works**: 4,933 offices taken here, a sample of 20 placed by Nominatim, 89 public organisations of RIPE with 108 networks and 82 autonomous systems |
| The code of law analysed: every act in force against its ties | `task analyse`, MCP `analysis`, `/api/analysis`, the act's page | **works**: 23,238 acts in force checked here in 2 s, 3,937 findings; tests on made-up acts for each kind and its exceptions |
| The simulation bubble: invented people talk about an act in rounds | `task python:simulate -- DU/1997/939` | **works**: three people, two rounds of the Banking Law in 48 s (ministral-3:8b); tests against a stand-in |
| Improvements proposed by a model from the act, its findings, debates and simulations | `task python:propose -- DU/1997/939` | **works**: qwen3:8b wrote one proposal per finding of the Banking Law from its consolidated text of 2026; a model's words, checked by nobody |
| The advanced strategy: a weak answer on to a deepseek hosted by Hugging Face | `task mastermind:ask -- --escalate` / `--hard`, `/api/ask?escalate=1`, the switch in the chat | **built**: tested against stand-ins of the host's model and of Inference Providers; not seen answering for real - the owner's token gets 402 until it has credits |
| The Python stack: the law through the MCP tools, the mastermind through the api | `stacks/python/`, `task python:law`, `task python:check` | **works**: its tests start the MCP server over stdio on a dataset of their own; `act` read from this machine's resources |
| The executive agent: a task done by qwen through MCP, written into `resources/agent/` | `task agent`, `task agent:container` | **works** (its own rounds): the school decree of 1919 read and summed up into a file, correctly, the act marked read; opencode 2 as host not yet reliable; the container's image builds with opencode 2.0.23, the run in it not done here |
| The law mastermind as a chat in the viewer (`#ask`); on the demo space on the visitor's own Hugging Face | the tab "ask the law", `/login` | **built**: the chat checked in a headless browser on this machine (ministral-3:8b, desktop and phone); signing in and the space's path tested against stand-ins; the real path refused by Hugging Face for want of credits (402), so not yet seen answering on the space |
| The law mastermind: a question answered from acts read through MCP, cited by ELI (deepseek-r1:8b) | `task mastermind:ask`, `/api/ask` with `MASTERMIND_URL`, compose profile `mastermind` | **works**: the host's Ollama on an RTX 3060, 30 s to 3 min a question; `/api/ask` in the image against it; the citations checked. The compose run with its own Ollama not started here |
| Acts by meaning in MCP (`search_meaning`) | MCP, `task do -- meaning "..."` | **works**: every embedded year (761 MB of vectors) kept as int8, 1.5 s a question after the first |
| MCP server for AI agents, read-only | `task mcp`, `/mcp` of the api and the space, `task mcp:ask` | **built**: tools listed and called over stdio and over http |
| Desktop window | `task desktop` | **built**: opened by the owner, the port problem fixed afterwards and not opened again |
| Android app | `task app:sync` | **wanted**: configured, Capacitor not installed |
| Browser extension (Firefox, Chrome) | `task extension` | **built**: citations read from seven examples; not loaded in a browser |
| Container: website and api (`webapp-server`) | `docker compose up` | **works**: the slim image built, published to ghcr.io by every release, served on 7860 for the demo |
| Services: docs, demo, daemons, routing, DNS, LLMs, search | `docker compose --profile <name> up` | **built**: each started once and answered; the daemons were not run, they would gather |
| A shell for agents (`agentic-shell`) | `task shell` | **built**: started, node, task, uv and git answer, the repository is writable, no Docker socket, no root (Q13) |
| Launcher: what you want to do, each function asking what it takes; every task; a REPL | `task` | **built**: driven in a pseudo-terminal (read the law → acts answered in it); termui itself stays an experiment (Q4) |
| The host in its corner: the release and what runs it (`HF-demo-readonly-container`), the whole note on a hover or a touch | `/api/host`, any page of the viewer | **works**: tests; seen in a browser at 1280 and 360 pixels, the corner the same size before and after a hover |
| Every function in every way: one catalog, `task do`, the REPL, `/api/catalog`, the map of functions | `task do`, `task functions:map` | **works**: tests; readings answered in the terminal over the real dataset |
| The rest of the dataset in the api, MCP and the viewer: the work of Sejm, judgments, the lists of the source, the acts counted | `/api/sejm`, `/api/judgments`, `/api/lists`, `/api/statistics`; `task stats` | **works**: tests; headless browser over a copy of term 10 and two years |
| Plots, and statistics with a playable history of the law | the viewer's tabs | **works**: headless browser, played |
| Settings of the viewer, every function shown (writing ones disabled), "Terms of use" | the viewer | **works**: headless browser |
| WebMCP: the reading offered to an agent in the browser | the viewer | **built**: six tools registered on `document.modelContext` in a headless browser; not yet called by an agent |
| Map controls: zoom, the whole map, an act found | the viewer's map | **works**: headless browser, the camera went to the act |
| Printing an act, or a PDF of it, from the desktop app | `task desktop` | **built**: the print styles checked in a headless browser; the app checked hidden, not printed on paper |
| The space following each release by itself | the release workflow, `task resources:space:refresh` | **built**: without a token it says so; not run against Hugging Face (needs the secret `HF_TOKEN`) |
| The introduction's living background (p5.js) | the website | **works**: headless browser, light, dark and a phone |
| Website of the project: idea and state | `task docs:build` | **works**: published on GitHub Pages and Read the Docs by every release |
| Deleting on Hugging Face what is not here (dataset, space) | `task resources:prune -- space` | **built**: not run - it deletes there, that is the owner's |
| Icons and the card of a shared link (favicon, manifest, `og:image`) | `task resources:media` | **built**: made from the gist `resources/mediafiles` with ffmpeg; checked in the built pages, not yet in a real share |
| Links to acts in the Hugging Face space | | **wanted** |

## Development

| Function | Command | State |
| -------- | ------- | ----- |
| All checks | `task verify` | **works**, except the termui experiment (Q4) |
| Checks on GitHub | `.github/workflows/checks.yml` | **works**: on the gate of a pull request into master, the release, the bots |
| Gate into master | `.github/workflows/gate.yml` | **built**: authors, verify, CodeQL, Snyk, OSSAR, then automerge; not run on GitHub yet (phase 26) |
| Workflows from a terminal | `task github:run`, `github:gate`, `github:pending` | **built**: `gh` of the owner's account |
| Hooks: Biome before a commit, conventional messages | git hooks | **works**: both refuse bad input (since 2026-11-13; before that they never blocked) |
| Dependency updates | `.github/dependabot.yml` | **built**: active once it reaches `master` |
| Bots' branches (Dependabot, Jarvis) | `.github/workflows/bots.yml`, `bots-land.yml` | **built**: active once they reach `master` |

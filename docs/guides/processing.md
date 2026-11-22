# From raw files to tables and texts

```sh
task seal                 # checksums for gathered files that have no record yet
task seal -- --check      # read every recorded file again, name the ones that differ
task compile              # tables: details and references of acts, a year in a file
task text                 # markdown from gathered HTML, with checksums
task text -- --pdf        # and from the PDFs of acts without HTML (poppler-utils)
```

None of these asks anything on the internet. They read `resources/bucket/`
and write into `resources/dataset/`. Each can be repeated at any time.

## Checksums: `seal`

A bucket on Hugging Face gives no checksum of a file, so the project keeps
its own. One line per file in `dataset/files/<journal>/<year>.jsonl`:

```json
{"path":"DU/1918/WDU19180010001.json","size":3578,"sha256":"0c1f2c7e...","url":"https://api.sejm.gov.pl/eli/acts/DU/1918/1","gatheredAt":"2026-10-13T13:25:12.282Z"}
```

| Field | Meaning |
| --- | --- |
| `path` | the file, inside the bucket |
| `size`, `sha256` | of the file as it was written |
| `url` | where it was taken from |
| `gatheredAt` | when |

The gatherer writes the record at the moment a file lands on disk, before
anything is sent anywhere. `task seal` is for files gathered before records
existed: it writes the missing records, with the file's modification time as
`gatheredAt`.

`task seal -- --check` reads every recorded file that is here and compares.
It prints the paths that differ and ends with an error when there are any.
Run it after pulling the bucket to another machine, or before a big push.

When a file has several records, the last one is the current one.

## Tables: `compile`

Details and references sit in the bucket as one small file per act. For
reading in bulk they are put together, a year in a file:

| Table | One line is | Made from |
| --- | --- | --- |
| `dataset/details/<journal>/<year>.jsonl` | the details of one act, as the API gave them | `<address>.json` |
| `dataset/references/<journal>/<year>.jsonl` | one tie between two acts | field `references` of the details |

A line of the references table:

```json
{"from":"DU/1918/2","type":"Uchylenia wynikające z","to":"DU/1918/23","date":"1918-10-21"}
```

| Field | Meaning |
| --- | --- |
| `from` | ELI of the act whose details name the tie |
| `type` | kind of the tie, from `lists/reference_types.json` |
| `to` | ELI of the other act |
| `date`, `art` | present when the API gives them |

All the references tables together are the graph of the law: which act
changes, repeals or carries out which. The first sixteen years of Dziennik
Ustaw give 45,658 ties for 11,008 acts.

Acts whose details are not gathered yet are left out. Tables are written
whole on every run.

## Texts: `text`

Every gathered HTML becomes a markdown file,
`dataset/texts/<journal>/<year>/<address>.md`, and a line in
`dataset/texts/<journal>/<year>.jsonl` ties it to its source:

```json
{"ELI":"DU/1918/2","markdown":"texts/DU/1918/WDU19180020002.md","sha256_md":"a85ee287...","sha256_html":"1fd223bc...","url":"https://api.sejm.gov.pl/eli/acts/DU/1918/2/text.html"}
```

| Field | Meaning |
| --- | --- |
| `markdown` | the markdown file, inside the dataset |
| `sha256_md` | checksum of the markdown |
| `sha256_html` | checksum of the HTML it was made from |
| `url` | the HTML at the source |

An HTML whose checksum did not change is not parsed again.

What the markdown looks like:

```markdown
# Ustawa z dnia 4 lutego 1918 r. o Radzie Stanu Królestwa Polskiego

## Treść ustawy

### Art. 1.

Rada Stanu Królestwa Polskiego z siedzibą w mieście stołecznem Warszawie składa się ze 110 członków, a mianowicie:

a) 12 członków wirylistów,
```

Articles, paragraphs (`§`) and chapters are headings. Points and letters
open their own line. Scripts and buttons of Sejm's reader are removed.

> **Remember!** The markdown was looked at only on acts from 1918 to 1933.
> Newer acts may use HTML this parser has not met, and tables are not turned
> into markdown tables. Read a few new ones before trusting it in bulk.

Only HTML is parsed: 39,110 of 164,638 acts have it, all in Dziennik Ustaw.
The other three quarters have only a PDF and get no markdown yet.

## Order of work

```
gather ──► seal (once, for old files) ──► compile ──► text ──► resources:push
```

## Texts of PDFs

`task text -- --pdf` gives markdown to acts that have only a PDF. The text
layer is read by `pdftotext` of poppler (`scripts/install.sh` installs
`poppler-utils`), which follows the two columns of a journal's page. Lines
become paragraphs, a word cut at the end of a line is glued back, and
`Art. 1.`, `§ 1.` and `Rozdział 1` become headings, as in markdown from HTML.
Four PDFs are read at a time (`--parallel`); a year of 1200 acts takes a few
seconds.

Most PDFs before the 2000s are scans that Adobe's Paper Capture gave a layer
of recognised text. That text is kept as it is, with its mistakes: nothing
is corrected by guessing. The record names the producer of the PDF, so a
reader can tell these texts apart:

```json
{"ELI":"DU/1953/228","markdown":"texts/DU/1953/WDU19530460228.md","sha256_md":"...","from":"pdf","sha256_pdf":"...","producer":"Adobe Acrobat 9.0 Paper Capture Plug-in","url":"https://api.sejm.gov.pl/eli/acts/DU/1953/228/text.pdf"}
```

A PDF with no text layer (fewer than 40 letters on all its pages, about one
in a hundred) gets no markdown; it is named in
`dataset/texts/<journal>/<year>.scans.jsonl` and waits for OCR. When an act
gets its HTML later, the markdown is made from the HTML again.

Without `--pdf`, `task text` keeps the texts made from PDFs as they are.

Readers say which texts these are: an act in the api has `text.from`
(`html` or `pdf`) with the producer and the source's address, the answer of
`/api/acts/<journal>/<year>/<pos>/text` carries the header `X-Text-From`,
the MCP tool `act_text` opens such a text with a line naming its PDF, and
the viewer puts a note above it.

## The map of the whole law: `map`

```sh
task map                        # every preset into dataset/map/
task map -- statutes-in-force   # one
```

All 165 thousand acts with 750 thousand ties are too many for a page, so a
preset takes a part of them, with the ties among its acts from
`dataset/references/`:

| Preset | Acts | Ties (2026-11-22) |
| --- | --- | --- |
| `statutes-in-force` | statutes (ustawy) in force | 2,848 / 2,234 |
| `statutes` | every statute since 1918 | 9,985 / 71,489 |
| `in-force` | every act in force | 20,484 / 11,953 |
| `statutes-in-force-by-meaning` | statutes in force that have a vector (`task embed`), each tied to its 5 nearest by meaning instead of the ties of the source | as many as have vectors |

ForceAtlas2 places them once, here (about a minute for all three), so a
browser only draws: the tab "map of the whole law" of the viewer shows them
with sigma.js, `/api/map/<preset>` gives them. Run `task compile` first, so
the ties are fresh. The files go to Hugging Face with the dataset, so the
demo can show them.

## Search over every year: `search:index`

```sh
task init                                         # once: resources/secrets/typesense_api_key
docker compose --profile search up -d typesense   # Typesense 30.2 on 127.0.0.1:8108
task search:index                                 # titles, types, statuses, keywords
task search:index -- --texts                      # and the first 2000 characters of each text
```

Every act goes into the collection `acts` (an act already there is
replaced). Titles, keywords and texts are tokenized as Polish. The api
answers `/api/search?q=...&type=&status=&journal=&page=` with acts, the
marked words of their texts and counts per type, status and journal. The
viewer shows a box "every year" when the search answers. Without Typesense,
`/api/search` answers 503 and says how to start it, and nothing else
changes. All 165 thousand acts take 10 seconds; with texts 20 seconds and
about 450 MB of memory in the service.

## Vectors of texts: `embed`

```sh
ollama serve &              # or: docker compose --profile llms up -d llms-ollama
ollama pull bge-m3          # once, about 1.2 GB
task embed                  # every text; task embed -- 2026 for one year
```

Every act with markdown gets one vector: its title and the first 2000
characters of its text, given to a local multilingual model through Ollama
(`EMBED_MODEL`, bge-m3 by default: 1024 numbers, Polish among its
languages). They go beside the texts, in
`dataset/embeddings/<model>/<journal>/<year>.parquet` (`ELI`, `sha256_md`,
`vector`), and `model.json` says how they were made. An act whose markdown
did not change keeps its vector, so a run is repeated to take what is new.

DU 2020 (2453 acts) took 1 minute 46 seconds on a GeForce RTX 3060 and
10 MB. All of the law would take about two hours and 670 MB.

## Search by meaning

With the vectors made, `task search:index` puts them into Typesense too (an
existing collection gets the field without being made anew). A search of
every year with `meaning=1` turns the question into a vector by the same
model of Ollama, and Typesense ranks acts by words and by meaning together.
A question in English finds Polish acts: "protection of children against
violence at school" found the acts of the Minister of Education on safety
in schools, where the words alone found one act. Without Ollama, the search
says `meaning: false` and works by words alone. The viewer shows the box
"by meaning, in any language" only when the host can do it.


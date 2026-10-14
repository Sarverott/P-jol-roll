# From raw files to tables and texts

```sh
task seal                 # checksums for gathered files that have no record yet
task seal -- --check      # read every recorded file again, name the ones that differ
task compile              # tables: details and references of acts, a year in a file
task text                 # markdown from gathered HTML, with checksums
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

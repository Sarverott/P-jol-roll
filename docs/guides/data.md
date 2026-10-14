# The data

Everything gathered lands in `resources/`, in two places with two jobs.

```
resources/
├── dataset/                    tables: small, read often
│   ├── lists/
│   │   ├── index.json          what the API offers, with addresses
│   │   ├── publishers.json     journals with their years and counts of acts
│   │   ├── statuses.json       every status an act can have
│   │   ├── document_types.json every type of act (Ustawa, Rozporządzenie, ...)
│   │   ├── reference_types.json every kind of tie between acts
│   │   ├── keywords.json
│   │   └── institutions.json
│   ├── acts/<journal>/<year>.jsonl        metadata, one act per line
│   ├── files/<journal>/<year>.jsonl       checksum and source of every gathered file
│   ├── details/<journal>/<year>.jsonl     details of acts, put together by compile
│   ├── references/<journal>/<year>.jsonl  ties between acts, one per line
│   ├── texts/<journal>/<year>.jsonl       which markdown was made from which HTML
│   ├── texts/<journal>/<year>/<address>.md  the text as markdown
│   └── checkups/<journal>/<year>.jsonl    what the browser saw, one visit per line
└── bucket/                     raw files of every act
    └── <journal>/<year>/
        ├── <address>.json              details
        ├── <address>.references.json   ties to other acts
        ├── <address>.pdf               the published text
        ├── <address>.html              the text as HTML, for some acts
        ├── <address>.struct.json       parts, chapters, articles of the HTML text
        └── <address>.T.pdf, .U.pdf     other texts of the act
```

The tables `files`, `details`, `references` and `texts` are described in
[from raw files to tables and texts](processing.md). Work of Sejm and court
judgments have their own directories: see [other sources](sources.md).

`<journal>` is `DU` or `MP`. `<address>` is the identifier the API gives to
every act, for example `WDU20260000001`.

## How an act is named

| Name | Example | Used for |
| --- | --- | --- |
| ELI | `DU/2026/1` | addresses of the API: journal, year, position |
| address | `WDU20260000001` | names of files; the id used by ISAP |
| display address | `Dz.U. 2026 poz. 1` | how lawyers cite it |

Old acts also have a number of the journal's issue (`volume`), as in
`Dz.U. 1918 nr 2 poz. 2`.

## Listing of a year

`dataset/acts/DU/1918.jsonl`, one line per act, sorted by position:

```json
{"address":"WDU19180020002","announcementDate":"1918-02-04","changeDate":"2024-03-14T21:22:56","displayAddress":"Dz.U. 1918 nr 2 poz. 2","pos":2,"promulgation":"1918-02-06","publisher":"DU","status":"uznany za uchylony","textHTML":true,"textPDF":true,"title":"Ustawa o Radzie Stanu Królestwa Polskiego","type":"Ustawa","volume":2,"year":1918,"ELI":"DU/1918/2"}
```

| Field | Meaning |
| --- | --- |
| `ELI`, `address`, `displayAddress` | the three names above |
| `publisher`, `year`, `pos`, `volume` | journal, year, position, number of the issue |
| `title`, `type` | title, and type from `document_types.json` |
| `status` | from `statuses.json`, for example `obowiązujący`, `uchylony` |
| `announcementDate` | date of the act itself |
| `promulgation` | date of publication in the journal |
| `changeDate` | when the record was last changed at the source |
| `textPDF`, `textHTML` | which texts exist. The gatherer trusts these |

The meanings of the two dates are how I read the data, not something the
API's documentation told me. *(assumed)*

## Details of an act

`bucket/DU/1918/WDU19180020002.json` repeats the fields of the listing and
adds, among others:

| Field | Meaning |
| --- | --- |
| `inForce` | `IN_FORCE`, `NOT_IN_FORCE` or unknown |
| `entryIntoForce`, `validFrom` | dates the act began to apply |
| `releasedBy` | who issued it, from `institutions.json` |
| `authorizedBody`, `obligated` | institutions the act empowers or obliges *(assumed)* |
| `keywords`, `keywordsNames` | subjects, and names mentioned |
| `texts` | every text file the source has: `fileName` and `type` |
| `references` | ties to other acts, as ids, grouped by kind |
| `prints` | prints of Sejm the act came from |
| `directives` | European directives the act carries out |
| `previousTitle` | earlier titles |

`texts` lists every text file of the act. The API documents five types and
does not say what the letters mean:

| Type | What it is | Kept as |
| --- | --- | --- |
| `O` | the published text. The same file as `text.pdf` (compared byte for byte on `DU/1918/2`) | `<address>.pdf` |
| `H` | the HTML text | `<address>.html` |
| `I` | in the acts looked at, the same file name as `O` | not taken twice |
| `T` | another PDF, named like `D20260001L.pdf` | `<address>.T.pdf` |
| `U` | another PDF, named like `D20260001Lj.pdf` | `<address>.U.pdf` |

On the ISAP website the same three files are offered as "tekst ogłoszony",
"tekst aktu" and "tekst ujednolicony". If `U` is the last of these, it is
the wording of the act with later amendments worked in by the office of
Sejm: not an official text, and the most useful one for reading the law as
it stands. *(assumed from the file names; not confirmed)* [`TODO`]

## Structure

`bucket/DU/2024/WDU20240001907.struct.json` is the skeleton of the HTML
text: a tree of parts, chapters, articles, paragraphs and points, each with
an `id` such as `chpt_1-arti_1-pint_2`. The API gives it only for acts that
have HTML; for the others it answers 404.

The same ids address one unit of the text at the source
(`/acts/DU/2024/1907/struct/{path}`). That is not gathered: the whole HTML
already holds every unit.

## References

`bucket/DU/1918/WDU19180020002.references.json` is the same set of ties,
with the other act described in full:

```json
{
	"Akty wykonawcze": [
		{ "act": { "ELI": "DU/1918/20", "title": "Rozporządzenie Ministra Sprawiedliwości ...", "status": "bez statusu" } }
	],
	"Uchylenia wynikające z": [
		{ "act": { "ELI": "DU/1918/23", "title": "Orędzie Rady Regencyjnej do Narodu Polskiego" }, "date": "1918-10-21" }
	]
}
```

The keys are the kinds from `reference_types.json`: legal basis, amendments,
repeals, executive acts, consolidated texts, rulings of the Constitutional
Tribunal and others. Together the references of all acts are a graph: which
act changes, repeals or carries out which. The examples above are shortened.

## Texts

- **PDF** is the published text. For old years it is a scan of the printed
  journal.
- **HTML** exists only for some acts. In the listing of 2026 none of 1321
  acts had it (checked on 2026-10-13).

HTML is turned into markdown by `task text`. PDF is not parsed yet.

## Checkups

See [checkup](checkup.md#what-it-writes).

## What it is

- **A copy of an official source.** Every file has an address at
  `api.sejm.gov.pl`, so anyone can compare our copy with the original.
- **A snapshot.** A file holds what the source said on the day it was
  gathered. `changeDate` in the listing shows when the source last changed
  the record; a listing newer than a details file means the details may be
  out of date.
- **Unchanged.** JSON is saved as it was answered (formatted with tabs), and
  PDF and HTML byte for byte.

## What it is not

- **Not legal advice**, and not a statement of the law in force today. An
  act marked `obowiązujący` may have been amended many times; the published
  text of an act is the text of the day it was published. The current
  wording of a statute is in its newest consolidated text (`tekst
  jednolity`) and the amendments after it.
- **Not complete history.** Dziennik Ustaw has no years 1940 to 1943. Law of
  the partitions before 1918, local law and official journals of ministries
  are not here.
- **Not the only law that applies in Poland.** European Union law, ratified
  treaties published elsewhere and court rulings are outside these two
  journals.

## Rights to the content

Polish copyright law does not cover normative acts and official documents
(article 4 of the act of 4 February 1994 on copyright and related rights),
so the texts of acts can be copied and shared. This is my reading and not
legal advice; the terms of the API itself were not found written anywhere.
[`TODO`: confirm the terms with the source]

The code of this repository is AGPL-3.0-only. The license of the dataset on
Hugging Face is set there, by its owner.

## Persons named in acts

Acts are public, and some name private persons: Monitor Polski publishes,
for example, decisions about state decorations. The project mirrors acts
unchanged and builds nothing that collects persons across acts.

# Ideas: what, where, how

Collected by Cleo on 2026-10-13. Nothing here is decided; Sett picks, changes
or drops any of it. Each idea says what it is, where it would live and how
it could be done. Things I checked are marked as checked; the rest is a guess.

## Next steps inside this source

- **Tables from raw files.**
  What: details and references of 164 thousand acts are small JSON files in
  the bucket; a dataset needs them as tables.
  Where: `src/compile.ts`, writing into `resources/dataset/`.
  How: one JSONL of details per journal and year, and one table of edges
  `from | type | to | art | date` built from the references. The edge table
  is the graph of the law and it will be small enough to open in a notebook.

- **Daily updates in place of full listings.**
  What: API has `/changes/acts?since={date}` (checked: it answers with acts
  sorted by change date).
  Where: a `--since` option of `gather`.
  How: remember the newest `changeDate` that was seen, ask only for what
  changed after it, and take the files of those acts again. Without this, an
  act whose status changes keeps its old details here forever, because a file
  that exists is never asked for twice.

- **Structure and other texts of an act.**
  What: API also gives `/struct` (chapters, articles, paragraphs) and more
  than one PDF per act. Details of `DU/2026/1` list four texts of types
  `O`, `I`, `T`, `U`. I do not know what the letters mean; my guess is that
  some of them are consolidated texts.
  Where: two more entries in `PARTS` of `src/eli.ts`.
  How: `struct` is one more JSON per act. The extra texts need the details
  first, because their file names are listed there.

- **Text for models.**
  What: HTML exists only for some acts. In the listing of 2026 none of 1321
  had it and 1317 had PDF (checked); `DU/2024/1907` has 1.4 MB of HTML
  (checked).
  Where: a parsing stage after gathering, separate from it.
  How: prefer HTML where it exists, PDF text where the PDF was born digital,
  and reading of scans only for the old years, marked as machine-read.

- **Links for people.**
  What: `checkup` writes what the browser saw on each website that shows an
  act.
  Where: `resources/dataset/checkups/`, shown in the space.
  How: the space can offer, for every act, the links that were alive at the
  last visit, with the date of that visit.

## Other government sources in Poland

One request each, made on 2026-10-13, to see whether they answer.

| Source | Address | What is there | State |
| --- | --- | --- | --- |
| Sejm, work of parliament | `api.sejm.gov.pl/sejm/term{N}/…` | legislative processes, prints with drafts and justifications, votings, proceedings, interpellations | answers; processes carry `ELI` of the act they ended with |
| SAOS, court judgments | `www.saos.org.pl/api/search/judgments` | judgments of common courts, Supreme Court, Constitutional Tribunal | answers; I did not check who runs it today or how complete it is |
| Open data portal | `api.dane.gov.pl/1.4/datasets` | catalogue of datasets of public offices | answers |
| National Court Register | `api-krs.ms.gov.pl/api/krs/OdpisAktualny/{krs}` | extract of one registered entity by its number | answers; there is no listing, the number has to be known |
| Statistics Poland, BDL | `bdl.stat.gov.pl/api/v1/…` | local statistics | answered 429: limit is 100 requests per 15 minutes |
| National Bank | `api.nbp.pl/api/exchangerates/…` | exchange rates, gold prices | answers |
| Government legislation | `legislacja.rcl.gov.pl` | drafts before they reach Sejm | website only, `robots.txt` disallows everyone |
| Administrative courts | `orzeczenia.nsa.gov.pl` | judgments | did not answer my request |

What fits this repository, in my order:

1. **Sejm processes and prints.** Same host, same manners, same `ELI`
   identifiers. It adds how each statute was made: the draft, the
   justification written by its authors, the votes. For an advisor the
   justification is often the clearest explanation of what an article is for.
2. **Judgments.** The law as it is applied. They cite acts by the same
   addresses, so they attach to the graph of references.
3. The rest is data about the country and not law. It belongs in another
   repository, if anywhere.

European Union law is a border case. Polish acts name the directives they
carry out (field `directives` in details), and EUR-Lex has its own open
access. It is not a foreign government, and it is law in force in Poland.
I would decide that after the Polish graph exists.

## Moving data to huggingface

- **Skip what is already there.**
  What: on a second machine the gatherer would ask Sejm again for files that
  the bucket already holds.
  Where: `src/gather.ts`, next to the check of local files.
  How: read the listing of the bucket once at start and treat those paths as
  gathered.

- **Buckets are compared by size only.**
  What: a bucket does not give a git hash, so `src/hub.ts` calls a file the
  same when path and size agree.
  How to do better: keep our own list of hashes in the dataset, written at
  gathering time.

- **One number worth knowing before the big run.**
  A dataset repository of huggingface is a git repository, and git is
  unhappy with hundreds of thousands of files. That is why raw files of acts
  go to the bucket and only tables go to the dataset.

## Housekeeping I noticed

- `Dockerfile` is still the first template. It does not build what `src/`
  is now.
- `scripts/Taskfile.yml` calls `./srcipts/hf-push.py`, and `scripts/` has no
  `pyproject.toml` for `uv`. `src/hub.ts` now does that job.
- `resources/dataset` and `resources/space` are git clones from the first
  round. The new sync does not use git there and skips `.git`.

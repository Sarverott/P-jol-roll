# Other sources

The journals say what the law is. Two more sources say how it was made and
how it is applied. Each has its own command, and all of them write into the
one dataset (tables, the training collection) and the one bucket (raw files),
each source in a directory of its own (phase 10).

| Command | Source | Local directories |
| --- | --- | --- |
| `gather` | ELI API of Sejm: the journals | `resources/dataset`, `resources/bucket` |
| `sejm` | API of Sejm's work: processes and prints | `resources/dataset/sejm`, `resources/bucket/sejm` |
| `saos` | SAOS: court judgments | `resources/dataset/SAOS` |

So `task resources:push -- dataset` and `-- bucket` send every source.
Before phase 10 they had directories of their own (`sejm-dataset`,
`sejm-bucket`, `saos-dataset`); `task resources:merge` moves what was
gathered there inside, never over a file that is there already.

## Work of Sejm: `sejm`

```sh
task sejm                              # tables of the current term
task sejm -- 9 10                      # of these terms
task sejm -- --all                     # of every term
task sejm -- 10 --files --limit 50     # and 50 files that are not here yet
```

Source: `https://api.sejm.gov.pl/sejm`, the same host and the same manners
as the journals. Prints exist for terms 6 to 10 (2007 until now); term 10
had 3426 prints on 2026-10-13.

| File | What it is |
| --- | --- |
| `dataset/sejm/terms.json` | terms of Sejm with their dates |
| `dataset/sejm/term10/processes.jsonl` | legislative processes, one per line |
| `dataset/sejm/term10/prints.jsonl` | prints, one per line, with names of their files |
| `bucket/sejm/term10/processes/<number>.json` | one process with its stages: referrals to committees, readings and what followed |
| `bucket/sejm/term10/prints/<number>/<file>` | files of a print: the draft with its justification, opinions |

A process that ended with a published act carries the `ELI` and `address`
of that act, so processes attach to the acts of the journals directly. The
justification inside a print is the authors' own explanation of what the
draft is for.

`--files` takes details of processes first, then files of prints. `--limit`
counts files, 20 by default. What is here is not asked for again. Tables
are written again on every run.

Not gathered yet: votings, proceedings and their transcripts,
interpellations, committees, members.

## Court judgments: `saos`

```sh
task saos -- 2025                  # 3 months of 2025 that are not here yet
task saos -- 2020 2021 --limit 0   # every month of these years
```

Source: `https://www.saos.org.pl/api`, System Analizy Orzeczeń Sądowych. It
holds 543 thousand judgments (2026-10-13) of common courts, the Supreme
Court, the Constitutional Tribunal, the National Appeal Chamber and
administrative courts, with full texts.

> **Remember!** SAOS is not a server of the state. It collects judgments
> that courts publish. Who runs it today and under what terms the data may
> be republished was not checked. [`TODO`] It is asked more slowly: 30
> requests per minute by default. It sits inside the dataset now, so
> `task resources:push -- dataset` sends it: decide about publishing before
> gathering it into a dataset that is pushed.

One file per month, by date of judgment:
`dataset/SAOS/judgments/2025/2025-01.jsonl`, one judgment per line, as the
API gave it. Fields that matter most here:

| Field | Meaning |
| --- | --- |
| `id` | number of the judgment in SAOS |
| `courtType`, `judgmentType`, `judgmentDate` | which court, what kind, when |
| `courtCases` | case numbers |
| `textContent` | the full text |
| `referencedRegulations` | acts the judgment refers to, with year and position of the journal |
| `source` | where SAOS took it from |

`referencedRegulations` is what attaches a judgment to the acts: it gives
`journalYear` and `journalEntry`, which is `DU/<year>/<entry>`.

A month is taken whole, page by page, and written when its last page
arrived. Only months that ended are taken; the running month would be kept
as a half of itself. A month that is here is not asked for again, so
judgments added later to an old month are missed until its file is deleted.
`--limit` counts months, 3 by default.

Dates in SAOS are sometimes wrong (a judgment dated in year 208, another in
3013). Those fall outside any year you would ask for.

Judgments name judges and case numbers. Parties are anonymised by the
courts before publication.

## What else was looked at

See [ideas](../.agents/ideas.md), "Other government sources in Poland": the
open data portal, the court register, statistics and the national bank
answer, and are data about the country and not law. They have no command
yet.

# Gathering

```sh
task gather                                  # lists, and metadata of the newest year, every journal
task gather -- 2025 2026                     # metadata of these years
task gather -- --all                         # metadata of every year
task gather -- 2026 --acts --limit 5         # and all files of the first 5 acts that miss any
task gather -- 2026 --parts pdf,html         # only these files
task gather -- --publisher MP                # one journal (DU, MP); can be repeated
task gather -- 2026 --acts --rate 60         # slower: 60 requests per minute
task gather:everything                       # everything the API has; asks before it starts
task gather:changes                          # acts changed since the previous such run
task gather:changes -- 2026-10-01            # acts changed since that day
```

The source is the ELI API of Sejm, `https://api.sejm.gov.pl/eli`. It is an
open API, so the gatherer uses plain requests, with no browser, and says who
it is in the User-Agent.

## What one run does

```
first walk
GET /                  index: names of everything the API gives
 └─ every list_*       statuses, types, reference types, keywords, institutions, journals
     └─ journals       DU and MP, each with its years
         └─ year       every act of the year, in one answer

second walk, one year after another
year ── act            the files that are not here yet
         └─ texts      other texts of the act, named in its details
```

1. The index is saved as `dataset/lists/index.json`, and every list it names
   as `dataset/lists/<name>.json`.
2. The list of journals opens the years: the newest one, the years you
   named, or all of them with `--all`.
3. Each year is saved as `dataset/acts/<journal>/<year>.jsonl`, one act per
   line, sorted by position.
4. With `--acts` or `--parts`, the files of acts are taken into
   `bucket/<journal>/<year>/`, a year at a time. See [the data](data.md) for
   what each file holds.
5. Every file that lands gets a record with its checksum in
   `dataset/files/<journal>/<year>.jsonl`.

## Files of an act

| Part | File | Exists for |
| --- | --- | --- |
| `details` | `<address>.json` | every act |
| `references` | `<address>.references.json` | every act |
| `pdf` | `<address>.pdf` | acts with `textPDF` |
| `html` | `<address>.html` | acts with `textHTML` |
| `struct` | `<address>.struct.json` | acts with `textHTML` |
| `texts` | `<address>.T.pdf`, `<address>.U.pdf` | acts whose details name more texts |

`--acts` takes all of them. `texts` are read from the details of the act, so
the details have to be here or be asked for in the same run.

## Options

| Option | Default | Meaning |
| --- | --- | --- |
| years, as plain numbers | the newest year | which years. A year the journal does not have is dropped |
| `--all` | off | every year of the journal |
| `--publisher DU` | every journal | which journal. Can be repeated |
| `--acts` | off | take every file of each act |
| `--parts details,pdf` | none | take only these files |
| `--limit 20` | 20 | how many acts one run takes files for. `0` means no limit |
| `--rate 120` | 120 | requests per minute |
| `--since 2026-10-01` | off | only acts changed since that day, or `last` |

Without `--acts` and `--parts`, only lists and listings are gathered.

## When is a file "here"

A file is not asked for when either is true:

- it lies in `resources/bucket/`;
- it has a record in `dataset/files/`.

The second rule is for a machine that has the dataset and not the bucket:
it does not ask Sejm again for what the bucket already keeps.

> **Remember!** If you delete a file to take it again, delete its lines in
> `dataset/files/<journal>/<year>.jsonl` too. With the record in place the
> file counts as gathered.

## Stopping and starting again

Stop it with `Ctrl+C` and start the same command again. It lists the years
again and takes what is missing. Nothing has to be resumed: what is
gathered is known from the files.

The gatherer keeps its queue of requests in memory and writes nothing to
`storage/`. The message about `CRAWLEE_PURGE_ON_START` that Crawlee prints
when interrupted does not apply here. A `storage/` directory left by earlier
versions can be deleted.

`--limit` counts acts that miss at least one file, in order of journals and
years. So `--limit 5` repeated five times takes 25 acts.

## Changes at the source

Sejm changes the records of old acts all the time: a status when an act is
repealed, new references when an act is amended. Between 12 and 13 October
2026 it changed 81 acts.

```sh
task gather:changes -- 2026-10-01     # the first time, with a day
task gather:changes                   # later: since the newest change seen before
```

It asks the API which acts changed, lists their years again, and takes the
details and references of those acts again. With `--acts` or `--parts` after
the day it takes those files instead. The published PDF is never taken
twice, because a published text does not change.

A file whose content really changed gets a new record in `dataset/files/`;
the old record stays above it, so the history of a file can be read.

The date to continue from is kept in `dataset/lists/changes.json`. It is
written only when the run finished without being cut by `--limit`.

> **Remember!** A year's listing is written again on every run, so it is
> always as fresh as the last run that listed that year. Details are as
> fresh as the last `gather:changes`.

## What it never does

- **It does not ask for texts that do not exist.** The listing says which
  acts have a PDF or an HTML. The API answers a missing HTML with status 200
  and an empty page, so the flags are trusted.
- **It does not treat "the source has none" as an error.** A 404 is logged
  and nothing is written.
- **It does not leave half a file.** A file is written as `<name>.part` and
  renamed when complete. After an interrupted run, `.part` files can be
  deleted.
- **It does not accept a wrong answer as a PDF.** A PDF must start with
  `%PDF`, and an empty text is an error.
- **It does not write outside its directory.** Names of files come from the
  answers of the API. An act or a text whose name could leave the directory
  is refused.
- **It does not hurry.** Two requests at a time. `--rate` sets the pace per
  minute.

## How big it is

Counts from the list of journals on 2026-10-13:

| Journal | Acts | Years |
| --- | --- | --- |
| `DU`, Dziennik Ustaw | 97,907 | 1918 to 2026, without 1940 to 1943 |
| `MP`, Monitor Polski | 66,730 | 1930 to 2026 |

The listings say 164,499 acts have a PDF and 39,110 have an HTML, all of
the latter in Dziennik Ustaw. Everything is then about 572 thousand
requests, plus the other texts, whose number is known only from details:
at 120 per minute, more than three days without a break.

The first sixteen years of Dziennik Ustaw (1918 to 1933, 11 thousand acts)
took 10 GB in 34 thousand files. *(The total size is not known yet.)*

## When something fails

| What you see | What it means |
| --- | --- |
| `DU/1950 is cut: 500 of 800` | the API gave only a part of the year. Not seen so far; if it happens, report it as a bug |
| `... source does not have it` | the API answered 404. Nothing is written; the next run asks again |
| `... is empty` | the listing promised a text and the API gave none. The crawler retries, then gives up on that file |
| `... did not answer with pdf` | something else came in place of a PDF, usually an error page |
| `act with unusable name` | the API gave an act whose address cannot be a file name. Report it as a bug |
| requests fail in a row | the API may be down or limiting. Stop, wait, lower `--rate`, start again |

Failed files are simply missing afterwards, so the next run asks for them
again.

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
```

The source is the ELI API of Sejm, `https://api.sejm.gov.pl/eli`. It is an
open API, so the gatherer uses plain requests, with no browser, and says who
it is in the User-Agent.

## What one run does

```
GET /                  index: names of everything the API gives
 └─ every list_*       statuses, types, reference types, keywords, institutions, journals
     └─ journals       DU and MP, each with its years
         └─ year       every act of the year, in one answer
             └─ act    details, references, PDF, HTML - the ones that are not here yet
```

1. The index is saved as `dataset/lists/index.json`, and every list it names
   as `dataset/lists/<name>.json`.
2. The list of journals opens the years: the newest one, the years you
   named, or all of them with `--all`.
3. Each year is saved as `dataset/acts/<journal>/<year>.jsonl`, one act per
   line, sorted by position.
4. With `--acts` or `--parts`, the files of acts are taken into
   `bucket/<journal>/<year>/`. See [the data](data.md) for what each file
   holds.

## Options

| Option | Default | Meaning |
| --- | --- | --- |
| years, as plain numbers | the newest year | which years. A year the journal does not have is dropped |
| `--all` | off | every year of the journal |
| `--publisher DU` | every journal | which journal. Can be repeated |
| `--acts` | off | take all four files of each act |
| `--parts details,references,pdf,html` | none | take only these files |
| `--limit 20` | 20 | how many acts one run takes files for. `0` means no limit |
| `--rate 120` | 120 | requests per minute |

Without `--acts` and `--parts`, only lists and listings are gathered.

## What it never does

> **Remember!** A file that exists is not asked for again. This makes a run
> safe to repeat, and it also means that an act which changed at the source
> keeps its old details here. Listings of years are the exception: they are
> written again on every run. To take a file again, delete it.

- **It does not ask for texts that do not exist.** The listing says which
  acts have a PDF or an HTML (`textPDF`, `textHTML`). The API answers a
  missing HTML with status 200 and an empty page, so the flags are trusted.
- **It does not leave half a file.** A file is written as `<name>.part` and
  renamed when complete. After an interrupted run, `.part` files can be
  deleted.
- **It does not accept a wrong answer as a PDF.** A PDF must start with
  `%PDF`, and an empty text is an error.
- **It does not hurry.** Two requests at a time. `--rate` sets the pace per
  minute.

## Stopping and repeating

Stop it with `Ctrl+C` and start the same command again. It reads the
listings again and takes what is missing.

`--limit` counts acts that miss at least one file, in order of years as their
listings arrive. So `--limit 5` repeated five times takes 25 acts.

> **Remember!** Do not start two gatherings in the same directory at once.
> The crawler keeps its queue of requests in `storage/` and clears it when it
> starts. *(This is how Crawlee works by default; two runs at once were not
> tried here.)* A second run needs its own `CRAWLEE_STORAGE_DIR`.

## How big it is

Counts from the list of journals on 2026-10-13:

| Journal | Acts | Years |
| --- | --- | --- |
| `DU`, Dziennik Ustaw | 97,907 | 1918 to 2026, without 1940 to 1943 |
| `MP`, Monitor Polski | 66,730 | 1930 to 2026 |

Everything means about 600 thousand requests: four per act at most, fewer
where a text does not exist. At 120 per minute that is three to four days
without a break. The size on disk is not known yet. *(Both numbers are
estimates; the first full run is in progress.)*

## When something fails

| What you see | What it means |
| --- | --- |
| `DU/1950 is cut: 500 of 800` | the API gave only a part of the year. Not seen so far; if it happens, report it as a bug |
| `... pdf is empty` | the listing promised a text and the API gave none. The crawler retries, then gives up on that file |
| `... did not answer with pdf` | something else came in place of a PDF, usually an error page |
| requests fail in a row | the API may be down or limiting. Stop, wait, lower `--rate`, repeat |

Failed files are simply missing afterwards, so the next run asks for them
again.

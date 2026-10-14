# Checkup of websites

```sh
task checkup -- 2026 --limit 6                # the browser visits 6 pages for acts of 2026
task checkup -- 2026 --frontend eli           # only one website
task checkup -- 2025 2026 --publisher MP      # Monitor Polski
task checkup -- 2026 --headless               # without a window
```

The API is where the data comes from. People do not read the API; they open
a website. `checkup` opens those websites for gathered acts and writes down
what a visitor would get: did the page open, where did it lead, what is its
title.

It needs the listing of the year, so run `task gather -- 2026` first.

## The websites

They are listed in `resources/frontends.json`:

| Name | Website | Address of an act |
| --- | --- | --- |
| `eli` | ELI permalinks | `https://eli.gov.pl/eli/{ELI}/ogl` |
| `isap` | Internetowy System Aktów Prawnych of Sejm | `https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id={address}` |
| `journal` | the journal's own site | `https://dziennikustaw.gov.pl/DU/{year}/{pos}`, `https://monitorpolski.gov.pl/MP/{year}/{pos}` |

`{ELI}`, `{address}`, `{year}`, `{pos}` and any other field of the listing
are filled in from the act. An address can be one for all journals or one per
journal.

> **Remember!** `robots.txt` of `dziennikustaw.gov.pl` disallows every
> crawler but Google (checked on 2026-10-13). The `journal` entry is kept so
> the choice is visible. To leave that site alone, remove the entry or name
> the others: `--frontend eli --frontend isap`.

To add a website, add an entry to the file. No code changes are needed.

## Why a browser

`isap.sejm.gov.pl` sends a plain request into a loop of redirects, and a
browser gets the page. The browser is
[Camoufox](https://camoufox.com), a Firefox build that looks like an
ordinary visitor. The window is visible by default, so you see what it does.

## Pace

One page at a time, 20 pages per minute, one retry. These are fixed in
`src/core/methods/checkup.ts`.

## Options

| Option | Default | Meaning |
| --- | --- | --- |
| years | required | which gathered years to walk |
| `--publisher` | `DU` | which journal. Can be repeated |
| `--frontend` | every one | names from `resources/frontends.json`. Can be repeated |
| `--limit 10` | 10 | how many pages one run opens. `0` means no limit |
| `--headless` | off | no window |

## What it writes

One line per visit in `dataset/checkups/<journal>/<year>.jsonl`:

```json
{"ELI":"DU/2026/1","frontend":"eli","url":"https://eli.gov.pl/eli/DU/2026/1/ogl","loadedUrl":"https://...","status":200,"title":"...","checkedAt":"2026-10-13T12:00:00.000Z"}
```

| Field | Meaning |
| --- | --- |
| `url` | the address that was asked |
| `loadedUrl` | where the browser ended after redirects |
| `status` | status of the answer. A 404 is written down like any other |
| `title` | title of the page |
| `error` | present when the page did not open at all |
| `checkedAt` | time of the visit, UTC |

A page that does not open is a finding and gets its line too.

A pair of act and website that already has a line is not visited again. To
visit again, remove its lines or the file.

## What was tested

The checkup was tested against a local page (answers 200 and 404). The
addresses in `frontends.json` were written from single requests and were not
walked in bulk. Start with `--limit 6` and look at the lines before a longer
run.

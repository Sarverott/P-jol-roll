# Things to check

Kept by Cleo. What waits for Sett's decision, and what was written and not
verified. A point leaves this page when it is settled. Dates say when the
point was added.

## Decisions for Sett

- **2026-10-13. Labels on GitHub.** Issue forms use the labels `data` and
  `source`, which do not exist yet. Until they do, those issues arrive
  without a label. `gh label create data` and `gh label create source`.
- **2026-10-13. Private reporting of vulnerabilities** is off for the
  repository, so `SECURITY.md` gives `sett@sarverott.com`, taken from
  gitrecon.
- **2026-10-13. Branches.** `CONTRIBUTING.md` says to branch from `master`,
  because the loop of branches is skipped for now. The workshop rule says
  `development`.
- **2026-10-13. The `journal` website in checkup.** `robots.txt` of
  `dziennikustaw.gov.pl` disallows every crawler but Google. The entry is in
  `resources/frontends.json`; removing it leaves that site alone.
- **2026-10-13. SAOS is not a server of the state.** It is a collection of
  published judgments with an API. Who runs it today and whether its data
  may be republished was not checked. Decide before pushing
  `resources/saos-dataset` anywhere.
- **2026-10-13. New repositories on Hugging Face.** `sejm-dataset`,
  `sejm-bucket` and `saos-dataset` are local directories only. When their
  repositories exist, add them to `resources/.map.json` under these names.
- **2026-10-13. `storage/`.** The first gatherer left more than 500 thousand
  small files there. Nothing reads them now. `rm -rf storage` frees them.
- **2026-10-13. `scripts/`.** `hf-push.py` and its Taskfile are kept, with
  the path fixed. `task resources:push` does the same job file by file. Keep
  or remove.
- **2026-10-13. gitrecon.** Its `CODE_OF_CONDUCT.md` says it covers "every
  repository of the Shakespeare project". Not touched from here.

## Written and not verified

- **`hub push` and `hub pull`** were never run against Hugging Face. Only
  `plan` was.
- **The Docker image** was not built. The `Dockerfile` assumes the browser
  that comes in the base image is the one `camoufox-js` finds.
- **`checkup`** ran only against a local page. Addresses in
  `resources/frontends.json` come from single requests; the links inside
  Sejm's own answers (`isap`, `eli`) have the same shape.
- **`gather --since`, `struct`, `texts`, `sejm`, `saos`** ran only against
  local copies of the APIs. The shapes of the real answers were looked at
  with one request each.
- **`seal`, `compile`, `text`** ran over the real files gathered until
  2026-10-13 (34,482 files, years 1918 to 1933), writing into a scratch
  directory. They were not run into `resources/dataset`.
- **Markdown** was looked at only for acts of 1918 to 1933. Newer HTML and
  tables were not seen.
- **Paging of changes and of processes** assumes a page smaller than asked
  is the last one. 500 per page was not tried on the real APIs; 1000
  processes in one answer was.

## Assumptions in the docs

- **Text types.** `O` is the published PDF (one act compared byte for byte).
  That `U` is "tekst ujednolicony" and `T` is "tekst aktu" is read from
  file names.
- **Dates in listings.** That `announcementDate` is the date of the act and
  `promulgation` the date of publication is how the data reads.
- **Copyright.** That normative acts are outside copyright is article 4 of
  the act of 1994, as I recall it. The terms of the API were not found
  written anywhere.
- **A published PDF never changes**, so `gather --since` does not take it
  again.
- **Requests for everything**: about 572 thousand plus the other texts,
  from counts in listings on 2026-10-13. Size on disk is unknown; sixteen
  years took 10 GB.

## Limits known and left

- A month of judgments that is here is not asked for again, so judgments
  added later to an old month are missed.
- A file with a record counts as gathered even when it is nowhere. Deleting
  a file to take it again needs its record deleted too.
- `hub` still compares a bucket by path and size. Records make it possible
  to check files here, and they do not check what is on Hugging Face.

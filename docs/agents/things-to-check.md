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
- **2026-10-14. The api is open to every origin.** `src/openapi` answers
  any website, because the data is public and the extension and the app
  ask from elsewhere. It listens on this machine only unless `HOST` says
  otherwise; `compose.yaml` says `0.0.0.0`. There is no limit of requests
  per client yet. Decide before it stands on the internet.
- **2026-10-14. Capacitor is not installed.** `src/app/capacitor.config.json`
  is ready, and `task app:sync -- add android` fetches the command line by
  `npx`, but the app also needs `@capacitor/core` and `@capacitor/android`
  in `package.json` and the Android SDK on the machine. Left to you,
  because it adds a native project under `src/app/android`.
- **2026-10-14. Two new development dependencies**: `@astrojs/vue` (Vue
  inside Astro) and `@types/express`. `tsconfig.json` got `ES2022` in
  `lib`, because the MCP library needs `ErrorOptions`.
- **2026-10-14. `src/chrome-ext/`** stays empty. The extension in
  `src/firefox-ext/` loads in Chrome too; a separate one is needed only
  when the stores want different packages.
- **2026-10-14. Workflow SDK pilot.** Nitro 3 is a beta, and `workflow`
  5.2.2 came out the day before it was added. `npm audit` names 13 "high"
  advisories, all one: an old `nanoid` inside `@workflow/core` that loops on
  a negative size; the fix it offers is a downgrade to `workflow` 2. The
  local world keeps runs in `.workflow-data` and is meant for development;
  long self-hosted use points to `@workflow/world-postgres`. No schedule
  yet: a run starts by `task workflows:daily` (or cron calling it).
- **2026-10-14. `tsconfig.json`** got `skipLibCheck`, because types inside
  the Workflow SDK and Nitro do not check against ours.
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

- **The Electron window** was not opened: its binary is not downloaded
  (`node node_modules/electron/install.js` does it), and a window on your
  screen at night was not mine to open. Its script passes a syntax check.
  2026-10-14: Sett opened it; the second start found the port taken,
  because the api outlived the window (npx -> tsx -> node, only npx was
  killed). Now it is one process on a free port that ends when its stdin
  closes. Checked by killing the parent hard; the window itself again not.
- **The extension** was not loaded in a browser. Reading citations from
  addresses and text was checked on seven examples.
- **The website and the api** were checked in headless Camoufox over the
  real listings: list of 2026, opening an act, its PDF link, no errors.
  Markdown in the viewer was seen only in tests, because `task text` was
  never run into `resources/dataset`.
- **The MCP server** was asked over stdio: start, list of tools,
  `search_acts`, `act_text`. Not added to any agent.
- **`compose.yaml`, `install.sh`, `install.bat`** were not run. `install.sh`
  passes `sh -n`.

- **The workflow server** ran over a local copy of the ELI API and a
  scratch `resources/`: all four steps, a wrong token (404), "no" (run
  completed, nothing pushed), and no answer in 5 seconds (completed, by
  "nobody in time"). `hub plan` and `hub push` steps were not run, and
  nothing was run against the real API or Hugging Face.

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

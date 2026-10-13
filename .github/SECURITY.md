# Security

## Reporting

Report a vulnerability privately by e-mail to **sett@sarverott.com**, not in
a public issue. Write what you found, how to repeat it and what it exposes.

There are no released versions yet. Fixes go to `master`.

## What counts here

- **A leaked token.** `HF_TOKEN` gives write access to the dataset, the
  bucket and the space on Hugging Face. It belongs in `.env`, which git
  ignores. If you see a token in a commit, an issue or a log, report it
  privately so it can be revoked.
- **A way to make the gatherer harm its source**: more requests than the
  limits allow, requests to a host that is not in `src/eli.ts` or
  `resources/frontends.json`, or a loop that never ends.
- **A way to write outside `resources/`.** Names of files come from the
  answers of the API (`address`, `publisher`, `year`). An answer that makes
  the gatherer write somewhere else is a vulnerability.
- **A way to delete or overwrite data on Hugging Face.** `hub push` only adds
  and updates files, and `hub pull` never overwrites a local file.
- **A vulnerable dependency** that this project really uses at run time:
  Crawlee, Playwright, Camoufox, `@huggingface/hub`.

## What does not count

- **A mistake in the data**: a missing act, a wrong field, a broken PDF. Use
  the "problem with data" issue form. If the mistake is in the source itself,
  it has to be reported to Kancelaria Sejmu; we can only note it.
- **A person named in an act.** Acts are official publications and this
  project mirrors them unchanged. If an act names you and that is a problem,
  write to the same e-mail and it will be answered, but the act itself stays
  published by its source.

## What the project protects

- Gathered files appear under their name only when complete (`.part` first),
  so an interrupted run does not leave half a file that looks whole.
- A gathered PDF is checked to start with `%PDF`, and an empty text is
  refused.
- Tests never touch the real API, the websites or Hugging Face.

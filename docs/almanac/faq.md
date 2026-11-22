# FAQ

**Why did the release fail when CodeQL had just reported alerts?**
The two were not connected. CodeQL opens alerts and fails nothing. The
image failed to build because the language packs were not in the Docker
context ([case](cataclistics/container-missing-locales.md)).

**The push stopped with "contains binary files". Is the dataset broken?**
No. A text from a PDF held control characters, and one such file refuses a
whole commit of 1000. Run `task text -- --pdf` (it makes only those texts
again), then push; the push holds back and names any that are left
([case](cataclistics/hub-binary-text.md)).

**The push waits for an hour. Is it stuck?**
No. Hugging Face takes 128 commits an hour per repository, and the push
waits that out by itself ([case](cataclistics/hub-commit-limit.md)).

**Files I deleted here are still on Hugging Face.**
A push never deletes: `task resources:prune -- dataset` (or `space`). It
asks first, and it never touches the bucket.

**Some acts have no text.**
About 1 in 100 PDFs is a scan without a text layer, and a few are damaged.
They are listed in `texts/<journal>/<year>.scans.jsonl`, the damaged ones
with their `error` ([topic](solutions/pdf-texts.md)).

**Texts of old acts have odd mistakes.**
They are the recognised text of scans (Adobe Paper Capture), kept as they
are. The record names the producer, and `X-Text-From: pdf` says so in the
api.

**A translation is wrong.**
Fix the entry in `resources/locales/<pack>.json` and list its hook in
`reviewed`; `task i18n:translate` never overwrites it
([topic](solutions/translations.md)).

**The demo answers 429.**
One address may ask `RATE_LIMIT` times a minute (600). Behind a proxy
`TRUST_PROXY=1` must be set, or every visitor counts as the proxy
([topic](solutions/security.md)).

**May an agent push the dataset, or start gathering?**
No: `task almanac:judge -- push dataset --actor agent` says why
([rulesets](rulesets/p-jol-roll.json)).

**Checks of a pull request say "action required".**
The pull request was opened by a workflow, and GitHub waits for a person
to approve its runs ([case](cataclistics/action-required.md)).

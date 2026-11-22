---
id: codeql-first-scan
labels: [bug]
status: solved
issue:
---

# The first CodeQL scan: 15 alerts, one of them a real path injection

**Status:** solved · **Topic:** [security](../solutions/security.md) ·
**Chain:** `codeql:first-scan → codeql:alerts → review:by-alert`

## What happened

The owner's `codeql.yml` ran first on master and opened 15 alerts: js/path-injection (10), js/request-forgery, js/xss-through-dom, js/missing-rate-limiting, actions/cache-poisoning (2).

## Cause

One was real: in the demo's remote mode a journal from an address went into a path (`acts/<journal>/<year>.jsonl`) and into the address fetched from Hugging Face, so `/api/acts/../1918` named a file beside the dataset. The others were the same flow seen from `writeWhole()`, a host typed into the extension becoming a link, a folder server of a devtool, no limit of requests, and a cache shared with checks of `dev/dependabot`.

## Solution

Parts of an address are checked once for every route (`routes.param`: a journal is letters, a year and a position numbers); the remote mode takes only plain paths below its directory (`inside()` in `remote.ts`); `RATE_LIMIT` requests of an address a minute (express-rate-limit, `TRUST_PROXY=1` in the image); the extension takes only an http(s) origin; the devtool's server resolves and stays below its folder; checks with a ref given use no npm cache; that did not end the cache-poisoning alert, so `checks.yml` takes no ref at all now and the bots' branches are dispatched to it ([case](copilot-prs-to-master.md)). `tests/remote.test.ts` sends a raw `..` and sees nothing leave.

## Seen

- 2026-11-22: alerts 1-15
- v0.15.3-v0.15.7

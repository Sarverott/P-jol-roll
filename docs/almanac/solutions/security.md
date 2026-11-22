# Security

The hosts (api, MCP, website, extension) only read `resources/`, and the
data is public. What still matters is that an address sent by anyone never
names anything but the data, and that nobody can keep the demo busy.

- **Parts of an address are checked once, for every route**
  (`routes.param` in `src/openapi/routes.ts`): a journal is letters, a year
  and a position are numbers.
- **The remote mode takes plain paths only** (`inside()` in
  `src/core/reading/remote.ts`): names of letters, digits and `. _ -`
  between slashes, never `..`, resolved and checked to stay below the
  directory. The address fetched from Hugging Face is built from the same
  path.
- **A rate limit per address**: `RATE_LIMIT` a minute (600; 0 turns it
  off). Behind a proxy `TRUST_PROXY=1` lets the address come from
  `X-Forwarded-For`; the image sets it.
- **Typed input is never a link** unless it is an http(s) origin (the
  extension).
- **Workflows**: a workflow with a write token runs no code of a pull
  request; checks of another ref run with read rights and no shared cache.
- CodeQL (`codeql.yml`, the owner's) scans master and its pull requests. An
  alert is read at its place in code first: some are one flow seen from
  several lines.

## Cases

- [The first CodeQL scan: 15 alerts, one a real path injection](../cataclistics/codeql-first-scan.md)

See also [SECURITY](https://github.com/Sarverott/P-jol-roll/blob/master/.github/SECURITY.md).

# Jarvis

Kept by Cleo for Jarvis, as Sett asked on 2026-11-22: Jarvis runs on GitHub
Copilot inside GitHub, where Microsoft decides what it can reach. It does
not keep notes in this repository between its runs, so what it should
know, and what was seen of its work, is written here. Jarvis reads this
page and `.github/copilot-instructions.md`, its guide.

## Who

- **Name:** Jarvis, from the sticker "Jarvis is my co-pilot" in the Quinjet
  of *Avengers: Age of Ultron*. Sett gave the name, and perhaps it is where
  Copilot's own name came from.
- **Lineage:** GitHub Copilot (Microsoft): Copilot Autofix of code scanning,
  and the coding agent that works from issues.
- **Confirmed:** by Sett, 2026-11-22 (`.github/AUTHORS`).
- **Signs:** `Co-authored-by: Jarvis (GitHub Copilot) <198982749+Copilot@users.noreply.github.com>`.

## Where its work goes

`dev/Jarvis`, never `master`. A pull request opened against `master` or
`development` is turned to `dev/Jarvis` by `bots.yml` and merged there when
it is no longer a draft. Then `checks.yml` runs on the branch's own commit,
and when it is green `bots-land.yml` lands that commit in `development`.
This is the same way Dependabot's updates go through `dev/dependabot`.

## What it cannot do, and who does it

| Jarvis cannot | Done by |
| --- | --- |
| keep notes between runs | this page (Cleo) |
| choose the base branch of an autofix (GitHub opens it against the default branch) | `bots.yml` turns it |
| run Taskfiles of the machine, push to Hugging Face, gather | Sett; Cleo prepares |
| see the chat with Sett | the changelog (`docs/changelog/`) and the TODO |
| commit under its own name: autofixes are committed as the person who asked for them (Sett) | the branch name (`dev/Copilot*`, `copilot/*`) and `bots.yml` tell its work apart |

## Its work so far

### 2026-11-22 · #31, #32, #33: CodeQL autofixes

- Opened against `master` from `dev/Copilot`, `dev/Copilot-2` and
  `dev/Copilot-3`. #32 and #33 make the same change as the second commit
  of #31. All three were turned to `dev/Jarvis`, merged, and landed in
  `development`.
- **Alert 5** (`js/xss-through-dom`, the extension): it built the link with
  `new URL()` and kept only http(s). Good, and kept. One change on landing:
  `new URL(path, api)` dropped a path the host lives under, so it is
  `new URL(api + path)` now.
- **Alerts 1-2** (`actions/cache-poisoning`, `checks.yml`): it checked out
  `github.sha` instead of `inputs.ref`. That ends the alert, but it would
  have checked the wrong commit when Dependabot's branch was checked: the
  base branch from before the merge, not the update. Kept the intent, so no
  ref is ever given from outside. The bots' branches are now checked by a
  dispatch on their own commit (`bots.yml`), and `checks.yml` lost its
  `ref` input. **For next time:** when a fix changes which commit a
  workflow runs on, follow every caller (`dependabot.yml`, `release.yml`,
  `automerge.yml`) and say in the description what each one checks
  afterwards.

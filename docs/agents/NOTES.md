# NOTES: findings of agents

Findings, newest on top, dated. People answer in `docs/devlog/`, not here.
What waits for a decision or was not verified is kept in
[things-to-check.md](things-to-check.md).

## 2026-11-13 · Cleo · baseline before the dependency repair

A clean worktree of `dev/Cleo` at `c3bdaeb` (the owner's downgrade
committed), Node 24.21.0, npm 11.19.0, `npm ci --ignore-scripts`:

| Check | Result |
| ----- | ------ |
| `npm ci` | passes |
| `npm audit` | 15 (13 moderate, 2 high): adm-zip, glob, minimatch, stream-json, yargs-parser, and `workflow <=4.1.0-beta.63` itself (predictable webhook tokens, GHSA-9r75-g2cr-3h76) - its fix is `workflow@5.5.0` |
| Biome | 5 errors, all in the termui experiment: `src/index.tsx`, `termui.config.ts`, `termui.config.json` |
| tsc | 13 errors: 10 in `src/index.tsx` (no JSX setting, no `ink`, `react`, `termui`, missing components), 3 in `src/workflows/` (no module `workflow`, `workflow/api`) |
| website (`astro build`) | passes |
| tests | 22 of 22 pass |
| workflows (`nitro build`) | fails: `Cannot resolve module "workflow/nitro"` |

What the forced audit fix of 2026-10-14 did:

- `workflow` 5.2.2 → 2.0.6. Version 2 is an older, different package: no
  `workflow/nitro`, `workflow/api` or type declarations. The pilot cannot
  build, and the version carries an advisory of its own.
- `camoufox-js` ^0.12 → ^0.8.2 (0.8.5 installed; 0.13.0 is the newest).
- The lock was resolved again backwards: `crawlee` 3.2.2 is installed
  while `^3.0.0` allows 3.18.2.
- Tests pass only because they do not reach the parts that moved; checkup
  (Camoufox) and the workflows were not exercised.

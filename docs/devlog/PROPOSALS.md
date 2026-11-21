# PROPOSALS: ideas in debate

Ideas of anyone, numbered `PP<n>`, in three parts: DEFINE (what it is),
COMBINE (what it joins with here), CONCLUDE (what it would change). The owner
decides; a decided proposal moves into the changelog. The older ideas of
October 2026 are in [../.agents/ideas.md](../.agents/ideas.md).

---

## PP1. Overrides instead of replacements, and when to drop them

**DEFINE.** `npm audit` said 39 (8 high) before Q9 and says 0 now. No
package had to be replaced: every advisory sat deep in a tool's own tree,
and `overrides` in `package.json` lift it to a fixed version -
`basic-ftp` 6 and `zod` 4.6.7 (the installer of `@go-task/cli`, the CLI
of the Workflow SDK), `glob` 14 and `minimatch` 11 (camoufox-js,
Electron's packager, oclif).

**COMBINE.** Two of them cross a major (`glob` 13 → 14 for camoufox-js,
`minimatch` 9/10 → 11 for oclif and others). `task check`, the Nitro build
and the CLIs of `workflow` and `camoufox-js` run with them; the browser
download of camoufox and `electron-forge make` were not run.

**CONCLUDE.** Keep the overrides, and remove each when the package that
pulls the old version moves on (Dependabot's pull requests show it). The
only replacement worth debating: `@go-task/cli` from npm could give way to
Task installed on the machine (`go-task/setup-task` in CI already, apt or
the install script locally); its installer is where the high advisories
came from. Not proposed now, because the npm wrapper is what puts `task`
in every fresh clone.

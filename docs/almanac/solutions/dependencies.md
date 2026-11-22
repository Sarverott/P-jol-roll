# Dependencies

- Never `npm audit fix --force`: it moves packages backwards, even to other
  packages of the same name. Put the ranges right, `npm update`, then
  `npm audit fix`.
- An advisory is judged by whether data from outside reaches it, not by its
  count.
- npm 11 runs no install script until it is listed in `allowScripts`.
- A tool that wraps another must pass its exit code on, or hooks block
  nothing: try a bad commit after any change to the hooks.
- Dependabot keeps them current (`.github/dependabot.yml`), through
  `dev/dependabot`.

## Cases

- [The git hooks let every commit through](../cataclistics/hooks-never-blocked.md)
- [`npm audit fix --force` moved packages backwards](../cataclistics/forced-audit-downgrade.md)
- [A fresh install has no `task` binary](../cataclistics/npm-install-scripts.md)

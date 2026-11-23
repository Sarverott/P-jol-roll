# The repository

- A submodule is added after its first content is pushed, and is left out
  of Biome.
- The owner's edits are committed as they are, on `dev/Sarverott`, before
  an agent's work.
- **Checks run on what lands, not before it.** `task flow:land` runs
  `task check` itself; a report of "checks pass" is true only of the tree it
  ran on.
- A directory that became a submodule cannot be checked out over: switching to
  a branch that still tracks its files stops on "untracked working tree files
  would be overwritten". `task flow:land` makes the merge without leaving the
  branch when development has nothing new (phase 28, `resources/locales`).

## Cases

- [The media submodule points at an empty commit, then breaks the lint](../cataclistics/gist-submodule.md)
- [A batch landed after its checks ran, before its last change](../cataclistics/checked-before-last-change.md)

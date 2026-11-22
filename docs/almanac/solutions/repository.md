# The repository

- A submodule is added after its first content is pushed, and is left out
  of Biome.
- The owner's edits are committed as they are, on `dev/Sarverott`, before
  an agent's work.
- **Checks run on what lands, not before it.** `task flow:land` runs
  `task check` itself; a report of "checks pass" is true only of the tree it
  ran on.

## Cases

- [The media submodule points at an empty commit, then breaks the lint](../cataclistics/gist-submodule.md)
- [A batch landed after its checks ran, before its last change](../cataclistics/checked-before-last-change.md)

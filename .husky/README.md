# Git hooks

Each hook here is one line that runs the task of the same name in
`Taskfile.yml`, so what a hook does is read and changed in one place.

```
// NOTE: here we will add some polishing thingies like biome formating 
// ANSWER: done (phase 21) - Biome formats in pre-commit and pre-merge-commit and checks in pre-push
```

| Hook | Task does |
| --- | --- |
| `pre-commit` | Biome formats and fixes the staged files and stages them again (`scripts/devops/local/format-staged.sh`), then the commit's own version |
| `commit-msg` | commitlint: a conventional commit |
| `pre-merge-commit` | the same formatting on what a merge brings, before its commit |
| `pre-push` | `biome check` of the whole tree: nothing unformatted leaves this machine |

A file with edits that are not staged is only checked, never staged again,
so nothing slips into a commit unasked. After a commit is made, formatting
can only leave the tree changed, so there is no `post-commit` hook: the
formatting happens before.

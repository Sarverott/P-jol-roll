# GitHub workflows and the loop

- A step of a workflow is a script of `scripts/devops/`, runnable by hand.
- A job takes its scripts from `development`, not from the branch it
  works on, which may be older.
- Bots work through their own branches: Dependabot `dev/dependabot`,
  Jarvis (Copilot) `dev/Jarvis`. Their pull requests open against master
  whatever is set; `bots.yml` turns them, merges them, checks the branch
  on its own commit and `bots-land.yml` lands it.
- A workflow never checks out a ref given from outside in a privileged
  run: the branch is dispatched to `checks.yml` instead.
- Runs of a pull request that a workflow opened wait for a person:
  approving them is the owner's.
- The version is bumped in pre-commit, before the message is checked: a
  header over 100 characters leaves the bump behind.

## Cases

- [Dependabot's pull requests do not land by themselves](../cataclistics/dependabot-flow.md)
- [Checks of a pull request opened by a workflow wait for a person](../cataclistics/action-required.md)
- [A refused commit leaves its version bump behind](../cataclistics/bump-left-behind.md)
- [Copilot's pull requests open against master](../cataclistics/copilot-prs-to-master.md)

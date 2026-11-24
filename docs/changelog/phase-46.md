# Phase 46: the repository on five more places

Append-only: sections are added at the end and never rewritten. Each starts
with `UNIXUSAT=<ms since epoch> · commit <hash>`. The owner's words are kept
word for word.

## UNIXUSAT=1795539034394 · commit 977759e2

The order of phase 41 goes on: "Next will be integrations for mirrors on
Bitbucket, Gitlab, sourcehut, gitea Official and own selfhostable gitea
container - each platform carries same rules for milestones creation, PR and
devlog relation, or else adopted things on GitHub." The accounts and their
tokens are Q21 (issue #139).

- **The mirrors** (`.github/bos.json: mirrors`, as in the BOS core - its
  `mirrors.sh` and `status-badges.sh` taken over): gitea.com, gitlab.com,
  bitbucket.org (the workspace apokryf), sr.ht and a Gitea of our own; every
  branch and tag pushed on every push to `development` (`mirrors.yml`), a
  status badge per place on the branch `badges`, shown in the README.
- **The same devlog** on those that keep issues - Gitea and GitLab: a
  milestone per milestone of ROADMAP, an issue per phase, Q<n> and PP<n>,
  labelled, closed when done or answered (`scripts/devops/mirrors/devlog.py`,
  on the model GitHub's `devlog.py` now shares). Bitbucket Cloud's issues
  have no milestones, and sourcehut's tracker is a service of its own: they
  carry the code. Pull requests, checks and releases stay on GitHub - the
  mirrors receive what was merged.
- **A Gitea of our own**: the compose profile `gitea`; checked here in a
  container - its repository made, every branch pushed, the devlog written
  whole (7 milestones, 78 issues) and written again with no change.
- What needs the owner: each mirror's token as a secret of the repository
  (`MIRROR_GITEA_TOKEN`, `MIRROR_GITLAB_TOKEN`, `MIRROR_BITBUCKET_TOKEN`,
  `MIRROR_SOURCEHUT_SSH_KEY`, `MIRROR_OWN_GITEA_TOKEN`, the variable
  `MIRROR_OWN_GITEA_URL`); until then each mirror is left out and said.

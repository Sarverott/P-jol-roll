# The repository on five more places

Phase 46, the owner's order: the repository mirrored on Bitbucket, GitLab,
sourcehut, gitea.com and a Gitea of our own, each with the same rules as
GitHub - its milestones, its devlog.

| Place | Code | Devlog (milestones, issues) |
| --- | --- | --- |
| github.com/Sarverott/P-jol-roll | the source | `task github:devlog`, `devlog.yml` |
| gitea.com/Sarverott/P-jol-roll | every branch and tag | written (Gitea's API) |
| gitlab.com/Sarverott/P-jol-roll | every branch and tag | written (GitLab's API) |
| bitbucket.org/apokryf/p-jol-roll | every branch and tag | - Bitbucket Cloud's issues have no milestones |
| git.sr.ht/~sarverott/P-jol-roll | every branch and tag | - sourcehut's tracker is todo.sr.ht, a service of its own |
| our own Gitea (`MIRROR_OWN_GITEA_URL`) | every branch and tag | written (Gitea's API) |

The workflow `mirrors.yml` does it on every push to `development`: each
repository made where it is not, every branch and tag pushed (deletions
too), the devlog written, a status badge per place on the branch `badges`
(the README shows them). A mirror whose secret is not set is left out and
said; one that fails shows `403 FORBIDDEN` on its badge and the run goes on.
Pull requests, checks and releases happen on GitHub; the mirrors receive
what was merged.

```bash
task mirrors                         # the same from here, with the tokens in the environment
MIRRORS_ONLY=own-gitea task mirrors  # one place
task mirror:gitea:up                 # our own Gitea, the compose profile gitea, on 127.0.0.1:3000
task unittesting:mirrors-gitea       # our own Gitea in a container: pushed, devlog written twice the same
```

## What the owner sets

Secrets of the repository on GitHub (Q21): `MIRROR_GITEA_TOKEN`,
`MIRROR_GITLAB_TOKEN`, `MIRROR_BITBUCKET_TOKEN` (an access token of the
repository, or an Atlassian API token), `MIRROR_SOURCEHUT_SSH_KEY` (a private
key whose public one sourcehut knows), `MIRROR_OWN_GITEA_TOKEN`; the
variable `MIRROR_OWN_GITEA_URL`. The repositories on Bitbucket and sourcehut
are made by hand once; Gitea and GitLab ones are made by the workflow.

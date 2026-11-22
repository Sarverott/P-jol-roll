# space

The demo space on Hugging Face
([spaces/Sarverott/docs-of-law-by-gov-in-poland](https://huggingface.co/spaces/Sarverott/docs-of-law-by-gov-in-poland)),
kept in git so that its `Dockerfile` is not edited at every release (phase 22).

| File | What it is |
| ---- | ---------- |
| `Dockerfile` | the space's Dockerfile: `FROM` the image of `${P_JOL_ROLL_VERSION}`, a build argument |
| `space.env` | the space's name and the release it runs (empty: the newest tag); the environment wins |

Hugging Face passes the variables of a space to its build as build
arguments. So a release sets the space's variable `P_JOL_ROLL_VERSION` and
asks for a fresh build, and the `Dockerfile` stays the same:

```bash
task resources:space                                   # this Dockerfile into resources/space (the local side)
task resources:push -- space                           # once, when this Dockerfile changed
task resources:space:refresh                           # the variable set to the newest release, the space built again (HF_TOKEN)
P_JOL_ROLL_VERSION=0.18.0 task resources:space:refresh # a release of your choice
```

The release workflow runs the refresh after the image is on ghcr.io, when
the repository has the secret `HF_TOKEN` (a token that may write to the
space).

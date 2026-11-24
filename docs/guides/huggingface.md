# Moving data to Hugging Face

```sh
task resources:plan -- dataset     # what differs; changes nothing
task resources:pull -- dataset     # take files that are there and not here
task resources:push -- dataset     # send files that are new or changed here; asks first
task resources:push -- bucket --batch 500   # commits of 500 files
task resources:prune -- space      # delete there what is not here; asks first; never the bucket
```

The name after `--` is a key of `resources/.map.json`:

| Name | Local side | On Hugging Face |
| --- | --- | --- |
| `dataset` | `resources/dataset` | [datasets/Sarverott/polish_national_law_docs](https://huggingface.co/datasets/Sarverott/polish_national_law_docs) |
| `bucket` | `resources/bucket` | [buckets/Sarverott/raw-law-of-poland](https://huggingface.co/buckets/Sarverott/raw-law-of-poland) |
| `space` | `resources/space` | [spaces/Sarverott/docs-of-law-by-gov-in-poland](https://huggingface.co/spaces/Sarverott/docs-of-law-by-gov-in-poland) |
| `conversations` | `resources/conversations` | [datasets/Apokryf/Consiliariis-Polonicum-Lex](https://huggingface.co/datasets/Apokryf/Consiliariis-Polonicum-Lex) - the mastermind's conversations (phase 31); its card is `resources/conversations/README.md`, kept in git |

The local sides are ignored by git of this repository.

## How it decides what to move

The two sides are compared file by file:

1. by path;
2. by size;
3. when both agree, by content: the hash git gives to a file, or SHA-256 for
   big files kept in LFS. The local file is read only at this step.

| The file is | `plan` calls it | `push` | `pull` |
| --- | --- | --- | --- |
| here and not there | upload | sends it | leaves it |
| there and not here | download | leaves it | takes it |
| on both sides, different | changed | sends the local one | leaves the local one and names it |
| on both sides, the same | same | nothing | nothing |

So repeating a push costs one listing and moves only what is new. Nothing is
moved twice.

> **Remember!** A bucket gives no hash. There a file counts as the same when
> path and size agree. A file that changed without changing its size would
> be missed. The project keeps its own checksums for that:
> `task seal -- --check` compares every file here with the record made when
> it was gathered. See [processing](processing.md#checksums-seal).

## What it never does

- `push` never deletes a file on Hugging Face. A file removed here stays
  there - until `prune` is asked for by name.
- `pull` never overwrites a local file.
- `.git`, `node_modules`, `.venv`, `__pycache__` and `.part` files are never
  moved in any direction.

## Push

Needs `HF_TOKEN` in the environment or in `.env`, with write access.

Files go in commits of 1000, titled `P-jol-roll: 1000 files (3000 of 14170)`.
`--batch` changes the number. A repository on Hugging Face takes at most 128
commits an hour; when it refuses one, the push says how long it waits, waits
and sends the same commit again (with commits of 100, a push of 14170 files
stopped at the 128th). If a push stops in the middle, start it again:
the commits already made are on the other side, and the comparison skips
their files.

## Prune

`task resources:prune -- space` deletes on Hugging Face every file that is
there and not here - the files `plan` lists as `download`. Look at them
first with `task resources:plan -- space`. It goes in commits of 1000, waits
out the hourly limit as push does, and asks before it starts. It refuses the
bucket: raw files may live on one machine only.

It was made for the space, which kept `app.py`, `development.md` and
`requirements.txt` of its marimo days after it became a Docker space. On the
dataset, prune only after a `pull`, or it deletes what this machine never
took.

## The space after a release

A restart of the space builds nothing new: Hugging Face keeps the image it
had. Since phase 22 the release is not written into the space's
`Dockerfile`: it is kept in git as `resources/configs/space/Dockerfile` and
takes the release as a build argument, `P_JOL_ROLL_VERSION`. Hugging Face
passes the variables of a space to its build as build arguments, so a
release sets that variable and asks for a fresh build:

```sh
task resources:space               # the space's files of resources/configs/space into resources/space
task resources:space:refresh       # its files from git when they differ, the variable, a fresh build, waited for (HF_TOKEN)
```

The release workflow runs the refresh by itself after the image is on
ghcr.io. Since phase 27 it also brings the space's own files from git
(`Dockerfile`, and `hub/README.md` as its `README.md`) when they differ,
and waits until the space runs and its `/openapi.json` names the release -
a build that fails, or takes more than 25 minutes, fails the release with
Hugging Face's own message. Its token is the space's **trusted publisher**:
the job has `id-token: write`, and GitHub's OIDC token is exchanged on
`https://huggingface.co/oauth/token` for a token of this one space, valid an
hour; no secret is kept for it. The secret `HF_TOKEN` stays the fallback.
With neither the job says so and the space keeps what it has. `resources/configs/space/space.env`
names the space and may pin a release; an environment variable wins over
it (`P_JOL_ROLL_VERSION=0.18.0 task resources:space:refresh`).

The space mounts the bucket at `/data`, the place where the image keeps its
cache and logs by default. Its `Dockerfile` moves both to `/tmp`
(`RESOURCES_DIR`, `LOG_DIR`); without that line every page read is written
into the bucket as `resources/` and `logs/` (phase 20).

## Which data goes where

Tables go to the dataset and raw files of acts go to the bucket.

A dataset on Hugging Face is a git repository. Xet, the storage behind it,
solves the size of files: big files are cut into chunks, a chunk that was
already sent is not sent again, and git keeps only a small pointer. It does
not change how many files git has to track. The recommendations of Hugging
Face for a git repository still stand (read on 2026-10-13):

| What | Recommended |
| --- | --- |
| files in a repository | under 100 thousand |
| entries in one folder | under 10 thousand |
| files in one commit | under 100 |

A bucket is object storage on the same Xet, without git, and that page says
these recommendations do not apply to buckets. So the raw files (several
per act, 164 thousand acts) belong in the bucket, and the dataset gets a
year in a file wherever it can.

`task text` writes one markdown file per act with HTML. The listings say
39,110 acts have HTML (all in Dziennik Ustaw, counted on 2026-10-13), in
folders of a year each, so the dataset stays inside these recommendations.
Parsing of PDF came in phase 12: with `task text -- --pdf` almost every act
gets a markdown file, about 164 thousand files, and the texts should then be
packed a year in a file: Q16 of the devlog asks it before they are pushed.

## What was tested

`plan` was run against the real dataset and bucket. `push` and `pull` were
not run against Hugging Face: their comparison is covered by tests, and the
upload and download calls are not. Try `push` first on a small directory.

## Before this

The first version cloned the repositories with git, and
`scripts/hf-push.py` sent a whole folder. Both are replaced by
`src/core/resources/hub.ts`. `resources/dataset` and `resources/space` may still hold a
`.git` directory from then; it is skipped.

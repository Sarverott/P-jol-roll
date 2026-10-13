# Moving data to Hugging Face

```sh
task resources:plan -- dataset     # what differs; changes nothing
task resources:pull -- dataset     # take files that are there and not here
task resources:push -- dataset     # send files that are new or changed here; asks first
task resources:push -- bucket --batch 500   # commits of 500 files
```

The name after `--` is a key of `resources/.map.json`:

| Name | Local side | On Hugging Face |
| --- | --- | --- |
| `dataset` | `resources/dataset` | [datasets/Sarverott/polish_national_law_docs](https://huggingface.co/datasets/Sarverott/polish_national_law_docs) |
| `bucket` | `resources/bucket` | [buckets/Sarverott/raw-law-of-poland](https://huggingface.co/buckets/Sarverott/raw-law-of-poland) |
| `space` | `resources/space` | [spaces/Sarverott/docs-of-law-by-gov-in-poland](https://huggingface.co/spaces/Sarverott/docs-of-law-by-gov-in-poland) |

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
> be missed.

## What it never does

- `push` never deletes a file on Hugging Face. A file removed here stays
  there.
- `pull` never overwrites a local file.
- `.git`, `node_modules`, `.venv`, `__pycache__` and `.part` files are never
  moved in any direction.

## Push

Needs `HF_TOKEN` in the environment or in `.env`, with write access.

Files go in commits of 100, titled `P-jol-roll: 100 files (300 of 5000)`.
`--batch` changes the number. If a push stops in the middle, start it again:
the commits already made are on the other side, and the comparison skips
their files.

## Which data goes where

Tables go to the dataset and raw files of acts go to the bucket. A dataset
on Hugging Face is a git repository, and git works badly with hundreds of
thousands of files. A bucket is object storage and has no such trouble.

## What was tested

`plan` was run against the real dataset and bucket. `push` and `pull` were
not run against Hugging Face: their comparison is covered by tests, and the
upload and download calls are not. Try `push` first on a small directory.

## Before this

The first version cloned the repositories with git, and
`scripts/hf-push.py` sent a whole folder. Both are replaced by
`src/hub.ts`. `resources/dataset` and `resources/space` may still hold a
`.git` directory from then; it is skipped.

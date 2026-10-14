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
> be missed. The project keeps its own checksums for that:
> `task seal -- --check` compares every file here with the record made when
> it was gathered. See [processing](processing.md#checksums-seal).

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
If parsing of PDF is added later and every act gets a markdown file, that
becomes 164 thousand files and the texts should then be packed a year in a
file.

## What was tested

`plan` was run against the real dataset and bucket. `push` and `pull` were
not run against Hugging Face: their comparison is covered by tests, and the
upload and download calls are not. Try `push` first on a small directory.

## Before this

The first version cloned the repositories with git, and
`scripts/hf-push.py` sent a whole folder. Both are replaced by
`src/core/resources/hub.ts`. `resources/dataset` and `resources/space` may still hold a
`.git` directory from then; it is skipped.

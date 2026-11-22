# Phase 20: the bucket tidied, the banner

Append-only: sections are added at the end and never rewritten. Each starts
with `UNIXUSAT=<ms since epoch> · commit <hash>`. The owner's words are kept
word for word.

## UNIXUSAT=1795348224194 · commit 5287ea4

The owner's message in the chat, 2026-11-22, after v0.17.0 was merged into
`master`, while the parquet files were being made. Word for word:

```text
sure, remove that 3 branches we just merged. parquet files are right now being generated and in remote bucket on huggingface i found duplicated logs and resources dir - remove them, it looks like somehow they was uploaded there... by the way i added in couple places this image in readme files and html tags: https://gist.githubusercontent.com/Sarverott/025bda4b967642107b88345c0e465b1a/raw/6cf448f5ef52a55ba8efb94e6d95e65f4df4954d/p-jol-roll_edited-color.png .
```

**What was done:** the three branches of Copilot were deleted. The bucket
held `resources/` (`.map.json`, `frontends.json`, 25945 files of the
dataset and five raw files) written by the demo space itself: the space
mounts the bucket at `/data`, and the image keeps its cache
(`RESOURCES_DIR=/data/resources`) and logs (`/data/logs`) there, so every
page read went into the bucket. They were deleted (no `logs/` file was
left by then); the space's `Dockerfile` now keeps both in `/tmp`, and
`task resources:space` writes that line when it is missing - the push of
the space stays the owner's. The banner was committed on `dev/Sarverott`:
the READMEs as they were, the `<img>` of the introduction made fit for JSX
(a style string makes React throw).

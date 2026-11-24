# Phase 31: families of models, Ollama on its own drive, conversations kept

Append-only: sections are added at the end and never rewritten. Each starts
with `UNIXUSAT=<ms since epoch> · commit <hash>`. The owner's words are kept
word for word.

## UNIXUSAT=1795498244278 · commit 7b42dd3

The owner's message in the chat, 2026-11-24, after the report of phase 30.
Word for word:

```text
okey then, so if it is not so good here then let's try to use gemma. as i know latest one is `gemma4`, right? it has also related kin like that previous releasings, `translategemma`, `medgemma`, `functiongemma` and any other strongly related like embedder or shielder models - principals are simple, all models from one familly acts as one team. also we can test out `ministral`, `llama`, `qwen` and else. maybe we have to consider change storage to own drive and add `bielik` that was been made as primarly to be for polish users. before more heavy downloads prepare for me script that uses that path as ollamas storage readed from `.env` and set it as "/run/media/sarverott/setternet-A60/.HoA/ollama" - remember to copy there current ollama storage so we will keep our models there. after that give me info so i will stop current server that is running and rerun it with your script. also please make that conversations be saved somewhere, like in resources inside separed dir or something - we want to collect as many results as we can, organize them by grouping families dirs and instances with continuum in these dirs as subdirs, then records of sessions as per file... let's begin.
```

Checked first: the Ollama of the host is `ollama serve` started by the
owner's user, its models in `~/.ollama/models` (6.0 GB: bge-m3,
deepseek-r1:8b); `/usr/share/ollama/.ollama/models` (4.4 GB) is left by a
system service that is not active, and is not touched. The drive
`setternet-A60` is mounted at `/run/media/sarverott/setternet-A60` (ext4,
222 GB free); its root belongs to root, so `.HoA` is made by the owner.
On ollama.com: `gemma4`, `translategemma`, `medgemma`, `functiongemma`,
`embeddinggemma`, `shieldgemma`, `gemma3n`, `ministral-3`, `llama4`,
`qwen3`, `qwen3-embedding` exist; Bielik is published by SpeakLeash and
others under their own names (`SpeakLeash/bielik-11b-v2.2-instruct`, ...).

Understood as:

- **Ollama's storage on the drive, read from `.env`** (`OLLAMA_MODELS`,
  the variable Ollama itself reads): a script copies the current models
  there and serves from there; the owner stops the running server and
  starts it again by the script. Nothing heavy is pulled before.
- **Every conversation kept**: in `resources/conversations/`, a directory
  per family of models, in it a directory per instance (the model and its
  size), in it a file per session - so the answers of every model are
  collected and can be compared.
- **Families as teams**, after the move: the models of one family share the
  work of the mastermind - one answers, one calls tools, one makes the
  vectors, one translates, one guards - gemma first (`gemma4` and its kin),
  then ministral, llama, qwen and Bielik, which was made for Polish users.

## UNIXUSAT=1795499454320 · commit d1344db

The owner's message in the chat, 2026-11-24, after Ollama's move was
prepared. Word for word:

```text
alright, i had prepare dedicated placing of that conversations to be storred for us - https://huggingface.co/datasets/Apokryf/Consiliariis-Polonicum-Lex . our server is rerunned according to what you guide me to do and after moving that current one conversation to subrepository and after we place that inside repo like we do that with other things delegated at huggingface we can continue next moves. please proceede
```

Checked: `ollama serve` runs again with `OLLAMA_MODELS` on the drive
(`task ollama:where`: 2 models, 6.0 GB there). The dataset
`Apokryf/Consiliariis-Polonicum-Lex` is public, holding a README with the
licence CC-BY-SA-4.0 only.

Understood as:

- **The conversations have a repository of their own on Hugging Face**,
  delegated the way the dataset, the bucket and the space are: a line of
  `resources/.map.json`, so `resources/conversations/` is its local side and
  `task resources:plan / pull / push -- conversations` move it. Its card is
  kept in git, as the bucket's is.
- **The one conversation kept so far is sent there**, by the owner's
  order in this message - the first time an agent pushes to Hugging Face
  here, asked for.
- **Then the next moves**: the families as teams.


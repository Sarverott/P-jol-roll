# Phase 32: the demo's AI - a chat on the visitor's own Hugging Face

Append-only: sections are added at the end and never rewritten. Each starts
with `UNIXUSAT=<ms since epoch> · commit <hash>`. The owner's words are kept
word for word.

## UNIXUSAT=1795504123727 · commit 33123a9

The owner's message in the chat, 2026-11-24, after the report of phase 31.
Word for word:

```text
Push these conversations, they will be good starter in sampling benchmark while we improve logic and other stuff related with cognitive mechanics. Also as for copy we left behind of ollama models - delete, here they are safely copied so why not? ;)
By the way if that is not problem we will gonna need demo's AI like in that other space on HuggingFace on my profile so fitting placing of chat is onboard

You can go with next phase there... I think
```

Done at once, as asked:

- **The conversations pushed**: `task resources:push -- conversations`
  sent 31 files to `Apokryf/Consiliariis-Polonicum-Lex`; the plan after
  it: 33 files the same there and here.
- **The copies of Ollama's models left behind.** `~/.ollama/models` was
  compared byte by byte with the drive and deleted (6.0 GB). The other one,
  `/usr/share/ollama/.ollama/models` (4.4 GB), was *not* a copy: it held
  `sebas`, `llama3` and `ifrit-0.1.0`, which were nowhere else. They were
  copied onto the drive first (`FROM=... task ollama:copy`), compared byte
  by byte, and Ollama serves them from there now; deleting that directory
  takes `sudo` (it belongs to the user `ollama`), the owner's.

Understood as:

- **The demo's AI, the way the owner's other space does it**
  (`Sarverott/omnilibris-archive-building`): the visitor signs in with
  Hugging Face (`hf_oauth`, scope `inference-api`) and the model runs on the
  visitor's own token through Inference Providers - the space pays nothing
  and gives no model's time away. The mastermind answers there as it does
  here, through the MCP tools, citing the acts by ELI; the acts found by
  meaning with bge-m3 of Hugging Face and the vectors of the dataset.
- **Its chat placed in the viewer**, where it fits: the screen kept empty
  for it since Q18 (`devilsAdvocate.vue`), a tab of its own.
- **The next phase is this one**: the plans ahead move one number on again.

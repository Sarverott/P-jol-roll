# Phase 30: the mastermind's first voice

Append-only: sections are added at the end and never rewritten. Each starts
with `UNIXUSAT=<ms since epoch> · commit <hash>`. The owner's words are kept
word for word.

## UNIXUSAT=1795493807644 · commit 0c107b3

The owner's message in the chat, 2026-11-24, after the report of phase 29,
which stopped before this phase because it downloads models. Word for word:

```text
sure, continue but for our dev needs you can use that ollama we have on host machine here (check "http://127.0.0.1:11434/" and use it when you need to use our GPU). But regardless of that, yes—please prepare that Docker Compose setup for us, so we can use the collection of containers on other machines instead of a local host server. go ahead, realize that plan further.
```

The Ollama of the host checked: version 0.34.0 on an NVIDIA GeForce RTX
3060 (12 GB), holding bge-m3 only (the vectors of `task embed`).
`deepseek-r1:8b` pulled into it (about 5 GB): the largest distilled
deepseek-R1 that fits the card beside the embedder, and one that calls tools.

Understood as:

- **Development uses the host's Ollama** at `http://127.0.0.1:11434`, its
  GPU; nothing here starts a second one.
- **The compose setup is for other machines**: the same collection of
  containers - the api with the MCP tools, Ollama with the models pulled by
  a container of its own, the mastermind beside them - started on a machine
  that has none of it, the GPU taken when the machine has one.
- **The plan of phase 30 realised** (VISION, phases ahead): a question in
  words answered by deepseek-R1, which reads the acts through the MCP tools
  and cites each by its ELI; the embedder finds acts by meaning.

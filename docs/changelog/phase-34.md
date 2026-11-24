# Phase 34: the advanced strategy, and the Python stack

Append-only: sections are added at the end and never rewritten. Each starts
with `UNIXUSAT=<ms since epoch> · commit <hash>`. The owner's words are kept
word for word.

## UNIXUSAT=1795521771331 · commit 8f2b347

The owner's message in the chat, 2026-11-24, after the report of phase 33.
Word for word:

```text
Are we ready? Then proceede further then
```

Understood as: phase 33 is accepted, and the next phase planned ahead begins
- the advanced strategy of Q18:

- **A deepseek hosted by Hugging Face for the hard questions**: a small
  model of the host answers first; a question it does not answer well -
  nothing it cites was read, or it cites what it never opened, or it says
  nothing - goes on to `deepseek-ai/DeepSeek-R1-0528` through Inference
  Providers (three providers serve it live), given what the small one read
  and said. On this machine it runs on the owner's own token (`HF_TOKEN`
  of `.env`) and only when the owner asks a question; on the space, on the
  visitor's. An agent does not ask it: the owner's account has no credits
  for Inference Providers yet (402, phase 32), so it is tested against a
  stand-in.
- **The Python stack of the models and simulations in a place of its own**:
  `stacks/python/`, a uv project of its own, reading the law through the
  same MCP tools as every other interface - the ground the simulations of
  phase 36 stand on; the Go stack of phase 37 goes beside it in
  `stacks/go/`.

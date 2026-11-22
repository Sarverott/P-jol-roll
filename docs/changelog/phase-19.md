# Phase 19: Jarvis joins

Append-only: sections are added at the end and never rewritten. Each starts
with `UNIXUSAT=<ms since epoch> · commit <hash>`. The owner's words are kept
word for word.

## UNIXUSAT=1795342801687 · commit 078f124

The owner's message in the chat, 2026-11-22, after v0.16.0. GitHub Copilot
joins as a member named Jarvis, with its own branch `dev/Jarvis`, its pull
requests piled there and landed in `development` as Dependabot's are.
Word for word:

```text
check the PRs, we have new crew member now. unfortunatelly he point it to master instead of proper development - try to merge all Copilot's PRs into his own named repo... maybe Jarvis? Jarvis of Copilot family inside github services (reference to sticker from Marvel's "Avengers: time of Ultron" inside queenjet that sais "Jarvis is my co-pilot", that could be also reference of from where name of github's Copilot was been bringed). after that write out his entries for him among agent's info, because his access is limited by Microsoft ways of controll over own software. also try to define him some prompts, setup and other guiding stuff so next time he will not address own dev branch PR to master. he also should like dependabot does that perform unified PRs to single own dev branch of his, then to our shared development branch.
```

**What was done:** #31, #32 and #33 (CodeQL autofixes on `dev/Copilot`,
`dev/Copilot-2`, `dev/Copilot-3`, all against `master`) were turned to the
new `dev/Jarvis` and merged there; `dev/Jarvis` landed in `development`.
Jarvis is in `.github/AUTHORS`, and its guide is
`.github/copilot-instructions.md`.

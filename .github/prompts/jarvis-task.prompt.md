---
mode: agent
description: A task of an issue done as Jarvis, in a pull request into dev/Jarvis
---

Do the task of ${input:issue:number or link of the issue}.

- Read `AGENTS.md`, `.github/copilot-instructions.md` and the part of
  `src/README.md` about the files you touch.
- Branch from `dev/Jarvis`; the pull request goes into **`dev/Jarvis`**,
  stays a draft while you work, and is marked ready when `task check` is
  green.
- Conventional commits (header at most 100 characters), each ending with
  `Co-authored-by: Jarvis (GitHub Copilot) <198982749+Copilot@users.noreply.github.com>`.
- Nothing to Hugging Face, no gathering against the real API, no secrets
  printed, nothing written in `docs/.agents/`.
- When the issue asks a question rather than a change, answer in the issue
  and change nothing.

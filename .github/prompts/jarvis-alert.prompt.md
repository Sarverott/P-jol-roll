---
mode: agent
description: Fix one code-scanning alert as Jarvis, in a pull request into dev/Jarvis
---

Fix the code-scanning alert ${input:alert:number or link of the alert}.

1. Read the alert and the code at its place; follow the value from where it
   enters (an address, a field, an input of a workflow) to the line flagged.
   Several alerts are often one flow seen from several lines: fix the flow
   where the value enters, not each line.
2. Look in `docs/almanac/` (start with `solutions/security.md`) for the same
   kind of case met before.
3. Keep what the code does: do not change which commit a workflow checks,
   which files a command writes, or what an api answers, unless that is the
   fix. Say in the description what stays the same and how you know.
4. Add or extend a test that shows the bad input refused (`tests/`).
5. `task check` green. One conventional commit with the line
   `Co-authored-by: Jarvis (GitHub Copilot) <198982749+Copilot@users.noreply.github.com>`.
6. The pull request goes into **`dev/Jarvis`**, never `master`.

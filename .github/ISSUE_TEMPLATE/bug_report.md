---
name: Bug report
about: A command failed, did something wrong, or the docs do not match what happens
title: ''
labels: bug
assignees: ''

---

**What happened**
A clear description of what went wrong.

**The command**
The exact command, and the last lines of its output or the error:

```sh
task gather -- ...
```

> Remove tokens (`HF_TOKEN`) and anything else you would not publish before pasting.

**What you expected**
What should have happened instead.

**Environment**
 - commit of P-jol-roll (`git rev-parse --short HEAD`):
 - Node.js version (`node -v`):
 - OS:
 - which part: [gather / checkup / hub plan / hub pull / hub push / tests / other]
 - for checkup: [with window / `--headless`], and which frontend

**Additional context**
The act it happened on (its ELI, for example `DU/2026/1`), how often it happens, whether repeating the command helps.

# Phase 25: checks before a push, writing functions behind a switch

Append-only: sections are added at the end and never rewritten. Each starts
with `UNIXUSAT=<ms since epoch> · commit <hash>`. The owner's words are kept
word for word.

## UNIXUSAT=1795381560651 · commit 9748ea1

The owner's message in the chat, 2026-11-22, after merging the pull request
of phase 24 (#39). Word for word:

```text
alright, consider adding to pre-push of husky local call of verify task. meanwhile i gave you response there. enjoy
```

The response is the owner's answer to Q19 in `docs/devlog/ORDERS.md`,
committed as it was on `dev/Sarverott` (c9db51e). Word for word:

```text
### Q19

sounds cool to me, add it with that command switch flag argument.
```

Understood as: the lean of Q19 is taken. A host started on this machine
with the switch `--allow-writing` may start the writing functions of the
catalog; a public host never does.

The question as it stood in `BRAINSTORM.md`, moved here:

### Q19. Writing functions in the viewer and the api: may a local host start them?

The owner asks for every function in every interface (changelog phase 22):
the viewer, the launcher, the REPL, the commands, the api. Rule 4 of
AGENTS.md and VISION say the opposite for hosts: "Hosts and interfaces
(api, MCP, website, extension) only read `resources/`; none of them may
start gathering." Gathering, making texts, the map, checksums and pushing
are writing functions. The catalog of phase 22 (`src/core/catalog/`) lists
them everywhere, and the viewer shows them disabled on every host, as the
owner asked for the space, until this is answered.

*Lean:* the desktop app, and an api started on 127.0.0.1 with
`--allow-writing`, may start them as jobs the viewer follows; a public host
(the space, the container, the website) never, shown disabled. The source
stays polite (two at a time, the project's User-Agent), a push still waits
for a person's "yes", and rule 4 is rewritten to say so.

**Decision:** the lean. The api started with `--allow-writing` (or
`ALLOW_WRITING=1`) on 127.0.0.1, ::1 or localhost, over its own
`resources/`, starts the writing functions of the catalog as jobs
(`POST /api/jobs`): each function's own task, one job at a time, its
output followed by the viewer. The desktop app starts its api so. Asked
for on another address or in the remote mode, the api does not start. A
job is taken only from the api's own pages (Host and Origin checked, JSON
only) and only with the person's yes, which the viewer asks before it
sends; the task's own prompt is then answered with it. A public host
never has the jobs, and the viewer shows the functions disabled there.

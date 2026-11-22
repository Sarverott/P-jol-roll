# BRAINSTORM: open questions

Questions for the owner, `## Q<n>. <title>`, each with a *Lean:* (what the
agent would pick). Answer in [ORDERS.md](ORDERS.md) (or in the chat);
answered questions move word for word into `docs/changelog/phase-<n>.md`
with their **Decision:**.

Q15 and Q16 were answered (changelog phase 12), Q17 and Q18 (changelog phase 22).

## Q19. Writing functions in the viewer and the api: may a local host start them?

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

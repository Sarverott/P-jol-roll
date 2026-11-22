# BRAINSTORM: open questions

Questions for the owner, `## Q<n>. <title>`, each with a *Lean:* (what the
agent would pick). Answer in [ORDERS.md](ORDERS.md) (or in the chat);
answered questions move word for word into `docs/changelog/phase-<n>.md`
with their **Decision:**.

Q15 and Q16 were answered (changelog phase 12).

## Q17. Web Serial and Web Bluetooth in the desktop app: what for?

`src/desktop/webserial.js` and `webbluethooth.js` were laid out empty
(phase 21). Electron gives a window serial ports and Bluetooth devices only
when the app chooses them (`select-serial-port`, `select-bluetooth-device`),
so each needs to know which device and why: a reader of documents, a
printer, a device of the workshop?

*Lean:* keep both closed (the files say so) until a device is named; then
the app lists only that kind, and asks the person before the window gets it.

## Q18. The devil's advocate screen: which model, where it runs

`src/gui/screens/devilsAdvocate.vue` says "chat app with AI agent here".
The pieces are there: the MCP tools read the law (`/mcp`, `client.ts`), and
Ollama already runs the model of the embeddings (`task embed`). Not decided:
which model answers, where it runs (this machine; the space has no GPU),
and what the screen may say, as the viewer says "not legal advice".

*Lean:* a screen shown only when the host has a model, as the search by
meaning is; a small multilingual model of Ollama on the host, given the
MCP tools, every answer with the acts it read as links, and the same "not
legal advice" line above it.

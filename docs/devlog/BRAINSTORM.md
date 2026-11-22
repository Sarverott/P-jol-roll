# BRAINSTORM: open questions

Questions for the owner, `## Q<n>. <title>`, each with a *Lean:* (what the
agent would pick). Answer in [ORDERS.md](ORDERS.md) (or in the chat);
answered questions move word for word into `docs/changelog/phase-<n>.md`
with their **Decision:**.

## Q13. What `agentic-shell` is for

The NOTE in `compose.yaml` asked for "shell gateway closest to connection
with physical host machine (agentic-shell)". A container that hands out a
shell near the host is the most dangerous service of the list: whoever
reaches it reaches the machine. I do not know who is meant to use it (an
AI agent of the project, you from another device, the desktop window) and
how close to the host it should be (its own container with the
repository mounted, or the host's own shell).

*Lean:* a container with the repository mounted and the project's tools
(node, task, git), reached only through `docker compose exec` - no port
at all - so an agent works in it instead of on the host. Nothing that
opens the host itself, unless you say so.

## Q14. What `hf-gateway` connects to

"manager of connection with huggingface to perform VPN connections with
wireguard (hf-gateway)". Hugging Face offers no WireGuard endpoint; it is
reached over HTTPS. So the tunnel must lead somewhere of yours - the
external machine of Q10, a VPS that pushes to Hugging Face, the network
of M5.

*Lean:* leave it for M5 (the network without a centre), where WireGuard
belongs anyway; until then the transfers to Hugging Face go as they do
(`task resources:push`). Say where the other end of the tunnel is if you
want it sooner.


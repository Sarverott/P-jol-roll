# Phase 38: mirrors on a WireGuard network, balanced by Traefik

Append-only: sections are added at the end and never rewritten. Each starts
with `UNIXUSAT=<ms since epoch> · commit <hash>`. The owner's words are kept
word for word.

## UNIXUSAT=1795525359296 · commit 25f28c7

No new words of the owner: the order of phase 35 goes on. The phase of
VISION:

> mirrors per voivodeship or district on a WireGuard network, balanced by
> Traefik

Understood as:

- **The mirrors as data**: `resources/configs/mirrors/mirrors.yaml`, one
  per voivodeship (its TERYT code its address on the network, 10.42.<code>.1),
  districts added the same way; each mirror's public key and endpoint
  written there by the machine that runs it - the shared registry, in git.
- **`pjolmesh`** in the Go stack: a mirror's WireGuard keys (the private
  one stays in `resources/secrets/`), its WireGuard configuration with every
  other mirror as a peer, and Traefik's configuration balancing the site
  across every mirror over the tunnels, each checked by `/api/host`.
- **The profile `mirror` of compose**: WireGuard, the api and Traefik in
  one network namespace - a mirror on any machine.
- **Checked here for real**: two mirrors in containers joined by a
  WireGuard tunnel, Traefik answering from both. Running mirrors on
  machines in the voivodeships is the owner's: machines, addresses, keys.

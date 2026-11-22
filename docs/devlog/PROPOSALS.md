# PROPOSALS: ideas in debate

Ideas of anyone, numbered `PP<n>`, in three parts: DEFINE (what it is),
COMBINE (what it joins with here), CONCLUDE (what it would change). The owner
decides in [ORDERS.md](ORDERS.md) under `### PP<n>`; a decided proposal moves
into the changelog. The older ideas of
October 2026 are in [../.agents/ideas.md](../.agents/ideas.md).

---

PP1 was approved (changelog phase 1); PP2 and PP3 were decided in the chat
(changelog phase 12).

## PP4. ESP32 boards as off-grid mesh nodes of the law

From the owner's answer to Q17 (changelog phase 22): "maybe we can add it
to proposals of usage that to perform off-grid backup mesh nodes of this
sovereign network of polish law... for sure it is much longer term yet."

**DEFINE.** Small boards (ESP32, Arduino-like, a serial port to the
desktop app) that keep a part of the dataset - the listings, the newest
acts, checksums - and pass it on over a mesh (LoRa, ESP-NOW, Bluetooth)
when there is no internet.

**COMBINE.** The desktop app reaches them by Web Serial
(`src/desktop/webserial.js`, laid out in phase 21); the checksums of
`task seal` say whether a node holds the same law; the network of M5 (IPFS,
torrents, WireGuard) is where they sync when they reach it.

**CONCLUDE.** The law stays readable off the grid; a small firmware
project, likely a repository of its own (and the Go stack of M5 for the
mesh's protocol). Longer term: after the network of M5 exists.

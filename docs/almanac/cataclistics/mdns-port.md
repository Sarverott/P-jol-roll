---
id: mdns-port
labels: [bug]
status: solved
issue:
---

# The internal DNS does not start

**Status:** solved · **Topic:** [containers](../solutions/containers.md) ·
**Chain:** `compose:up → internal-dns:bind-5353 → port:taken`

## What happened

The internal-dns service could not bind its port.

## Cause

Port 5353 is mDNS (avahi) on most desktops.

## Solution

internal-dns listens on 15353 (`DNS_PORT`).

## Seen

- 2026-11-22: phase 9

# Phase 5: gathering on another machine

Append-only: sections are added at the end and never rewritten. Each starts
with `UNIXUSAT=<ms since epoch> · commit <hash>`. The owner's words are kept
word for word.

## UNIXUSAT=1795297639670 · commit 065f981

The owner's answers to Q10 and Q1 of BRAINSTORM.md, written in ORDERS.md during
the break for the heavy gathering (commit 065f981 on `dev/Sarverott`).
Word for word:

### Q10

````markdown
> DISCLAIMER: it should be implemented not all-at-once but in more distant future as modular feachering.

right now we work only on one machine with single entrypoint to WAN and single source of thruth. we want to split it all into torrents, point them out with ipfs, build tunneled network with wireguard to be managable and loadbalancers to divide work and rule over more then one machine that we can use to proceede that all.

drive should be easy to making mirrors of it and in later concept i was thinking about placing hosts of that in every capital city of a voivodeship at least, or even instance per every district in poland. each such instance would be an independent host for the district administration 

no centralized infrastructure, blockchained with cosmos sdk
````

**Decision:** the far plan (torrents, IPFS, a WireGuard network, load balancing, mirrors per voivodeship or district, no central infrastructure, Cosmos SDK) becomes milestone M4 of ROADMAP.md, modular and later; nothing of it is built now.

### Q1

````markdown
for that we have to add rich logging into project and delegation of network log collector like `rsyslog` (add that to stuff related with docker compose)

inside `tests/unittesting/` dir should be containers to test system on other OS we want to support. add `parrot-os` dir and inside it setup for headless gatherer `headless-server` with case named `-gather-and-parse`.

later on we will also integrate virtualbox stations and proxmox inside there to test all possibilities - this will come here even later then decentralization.
````

**Decision:** rich logging in the project and a network log collector (`rsyslog`) among the compose services; test containers for other systems in `tests/unittesting/`, first `parrot-os/headless-server/` with the case `-gather-and-parse`; VirtualBox and Proxmox stations later than decentralisation.

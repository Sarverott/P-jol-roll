# Phase 37: the dataset and the bucket as torrents pointed to by IPFS; the Go stack

Append-only: sections are added at the end and never rewritten. Each starts
with `UNIXUSAT=<ms since epoch> · commit <hash>`. The owner's words are kept
word for word.

## UNIXUSAT=1795524738657 · commit 2cde191

No new words of the owner: the order of phase 35 goes on (every phase
planned ahead, until one needs the owner). The phase of VISION, the first
of M5 (no centre):

> the dataset and the bucket as torrents pointed to by IPFS; the Go stack
> begins

Understood as:

- **The Go stack begins** in `stacks/go/` (Q18: "a third in Go for the
  decentralisation circuits"), a module of its own with its tests and
  tasks, its version kept with the others.
- **Torrents of the dataset and the bucket**: one per part of the dataset
  and one per journal and year of the bucket, made from the files here,
  each with web seeds (BEP 19) pointing at the same files on Hugging Face -
  so a torrent downloads even when nobody seeds it, and every peer that
  keeps it shares it on.
- **Pointed to by IPFS**: the torrents and their index as one UnixFS
  directory, its CIDs computed here, offline, and written as a CAR file -
  the root CID is where the torrents are found. Putting it on the IPFS
  network is publishing, so it is the owner's move, as pushing to Hugging
  Face is: a compose service of IPFS (kubo) and `task torrents:publish`
  are ready for it.

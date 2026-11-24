# Phase 39: no centre - the mirrors agree on the law by Cosmos SDK

Append-only: sections are added at the end and never rewritten. Each starts
with `UNIXUSAT=<ms since epoch> · commit <hash>`. The owner's words are kept
word for word.

## UNIXUSAT=1795527026209 · commit 76abb75

No new words of the owner: the order of phase 35 goes on. The phase of
VISION:

> no centre: the mirrors agree on the law by Cosmos SDK, the checksums of
> `task seal` the shared truth

Understood as:

- **The chain of the law** (`stacks/go/lawchain`): a Cosmos SDK chain
  (v0.53, CometBFT), scaffolded by Ignite, with a module of its own, `law`.
  Its validators are the mirrors: a mirror records the root of each year it
  sealed - the sha256 of every file's path and checksum of `task seal` -
  and the chain answers what the mirrors agree a year is: the root sealed by
  two thirds of the bonded mirrors or more. An account that is not a bonded
  validator cannot seal.
- **`pjolchain roots`** in the Go stack: the roots of the years sealed
  here, as the chain takes them; `task chain:seal` records them (it sends
  transactions, so it asks first).
- **Checked here**: the agreement of four mirrors in the module's tests, and
  a chain of one mirror started for real - a year sealed and agreed, a
  stranger refused. The genesis of the network of mirrors (each mirror's
  validator, their stake, the chain's id) is the owner's.

# The chain of the law

The third step of M5, *no centre* (phase 39): the mirrors agree on what the
law is, with no one of them trusted above the others. Each mirror seals the
files it holds (`task seal`); the roots of those seals go on a chain - a
Cosmos SDK chain, `lawchain` - whose validators are the mirrors; the chain
answers, for every year of every journal, the root two thirds of the mirrors
agree on.

## What is recorded

For each year, a mirror's root is the sha256 of `"<path> <sha256>\n"` of
every file of its seal records (`dataset/files/<journal>/<year>.jsonl`),
sorted by path. Two mirrors with the same files have the same root; one
whose files differ - a file missing, changed, corrupted - has another, and
is outvoted where everyone can see it.

```bash
task go:roots -- -journal DU                     # the roots of the years sealed here
lawchaind query law agreement DU 2026            # what the mirrors agree DU 2026 is
```

Only the account of a bonded validator - a mirror - may seal. The share
that agrees is a parameter of the chain (`share`, 67%), changed only by its
governance.

## A network of mirrors: its genesis

The owner's, once, with the machines of the first mirrors:

1. **Each mirror** builds the chain (`task chain:build`) and makes its home
   and key in `resources/.containerdatavol/lawchain`:
   `lawchaind --home resources/.containerdatavol/lawchain init <mirror> --chain-id lawchain`,
   then `lawchaind keys add <mirror>`.
2. **The coordinator** adds every mirror's account to one genesis
   (`lawchaind genesis add-genesis-account <address> <stake>stake`) and
   sends it round.
3. **Each mirror** signs its validator (`lawchaind genesis gentx <mirror>
   <stake>stake --chain-id lawchain`) and sends the file back.
4. **The coordinator** collects them (`lawchaind genesis collect-gentxs`) and
   sends the final `genesis.json` to every mirror, with the addresses of
   the others as persistent peers - over the WireGuard network of phase 38
   (`10.42.<code>.1:26656`).
5. **Each mirror** starts its node: `docker compose --profile chain up -d`,
   then records its roots: `task chain:seal -- <mirror>`.

After a gathering, `task seal` and `task chain:seal` again: the chain keeps
each mirror's newest root of each year.

## Checked here

- The module's tests (`task go:check`): four mirrors, two of them on one
  root (the most, not agreed), then three (agreed, 75%); an unbonded
  validator and a stranger refused; a broken seal refused.
- `task unittesting:chain`: a chain of one mirror built and started on this
  machine, a year sealed by the mirror's account and agreed, a stranger's
  seal refused in its block. 25 s.

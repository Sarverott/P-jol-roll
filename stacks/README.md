# The stacks

The law mastermind's plan (Q18) gives the project more than one language,
each in a place of its own so it keeps its integrity inside:

| Stack | Since | What it is for |
| --- | --- | --- |
| TypeScript (`src/`) | phase 0 | the gatherer, the api, MCP, the viewer, the mastermind |
| [Python](python/README.md) (`stacks/python/`) | phase 34 | the models and the simulations (MiroFish or OASIS, phase 36) |
| [Go](go/README.md) (`stacks/go/`) | phase 37 | the decentralisation circuits: torrents pointed to by IPFS (`pjolseed`), mirrors on WireGuard balanced by Traefik (`pjolmesh`), the chain of the law by Cosmos SDK (`lawchain`, `pjolchain`) |

Each reads the law through the project's own MCP tools (`src/mcp`) and
never the source, and carries the project's one version.

# The Python stack

The second stack of the law mastermind (phase 34, the owner's plan in Q18):
the models and the simulations in a place of their own, a uv project apart
from the TypeScript of `src/`, so each keeps its integrity inside. The
simulations of phase 36 (MiroFish or OASIS) are built here.

It reads the law the way every other interface does - through the project's
own MCP tools (`src/mcp`), never the source - and asks the mastermind
through the api (`/api/ask`).

```python
import asyncio
from pjolroll import Law, Mastermind


async def main():
    async with Law.open() as law:  # the MCP server of this repository, over stdio
        print(await law.act("DU/1918/2"))
        print(await law.nearest("Rada Stanu", limit=3))


asyncio.run(main())

# a running api with a mastermind (task serve with MASTERMIND_URL)
print(Mastermind().ask("Czym była Rada Stanu?", escalate=True)["answer"])
```

| Module | What it does |
| --- | --- |
| `pjolroll.law` | `Law`: the MCP tools - `act`, `text`, `references`, `search`, `nearest`, `call` |
| `pjolroll.mastermind` | `Mastermind`: `/api/ask` of a running api - `ask(question, escalate=, hard=)`, `about()` |
| `pjolroll.simulation` | the simulation bubble (phase 36): `simulate(law, eli, rounds=, people=)`, `personas()`, `simulations(eli)` |
| `pjolroll.proposals` | improvements proposed: `propose(law, eli)` |
| `pjolroll.model` | a model of an OpenAI-like api (the host's Ollama), JSON mode, the first object of what it wrote |
| `pjolroll.__main__` | the same from a terminal: `task python:law -- act DU/1918/2` |

| Variable | Default | What it is |
| --- | --- | --- |
| `MCP_URL` | | an MCP server over http (`/mcp` of an api, of the space); unset: this repository's over stdio |
| `API_URL` | `http://127.0.0.1:8080` | the api the mastermind is asked through |
| `RESOURCES_DIR` | `resources/` | what the stdio server reads, as everywhere in the project |

```bash
task python:sync      # uv sync
task python:check     # ruff, then pytest (the tests start the MCP server over stdio)
task python:law -- nearest "obowiązek szkolny"
task python:simulate -- DU/1997/939 --rounds 3 --personas 6
task python:propose -- DU/1997/939
```

The simulations and proposals: [the guide](../../docs/guides/analysis.md).

Its version is the project's, kept by `task version:sync` with the others.

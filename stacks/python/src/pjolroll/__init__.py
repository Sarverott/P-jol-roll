"""The Python stack of P-JOL-ROLL (phase 34, Q18): the models and simulations in a place of their own.

They read the law the way every other interface does - through the project's own MCP tools
(src/mcp) - and ask the law mastermind through the api (/api/ask), never the source:

    from pjolroll import Law, Mastermind

    async with Law.open() as law:            # npx tsx src/mcp/main.ts over stdio, or MCP_URL
        print(await law.act("DU/1918/2"))

    print(Mastermind().ask("Czym była Rada Stanu?", escalate=True)["answer"])
"""

from pjolroll.law import Law, LawError
from pjolroll.mastermind import Mastermind, MastermindError

__all__ = ["Law", "LawError", "Mastermind", "MastermindError"]

"""The stack from a terminal (task python:law -- ...):

pjolroll tools                       the tools of the MCP server
pjolroll act DU/1918/2               the details of an act
pjolroll text DU/1918/2              its text
pjolroll nearest "Rada Stanu"        the acts nearest by meaning
pjolroll ask "..." [--escalate|--hard]   the mastermind of a running api (API_URL)
"""

from __future__ import annotations

import argparse
import asyncio
import json
import sys

from pjolroll.law import Law, LawError
from pjolroll.mastermind import Mastermind, MastermindError


async def read(command: str, value: str) -> str:
    async with Law.open() as law:
        if command == "tools":
            return "\n".join(await law.tools())
        if command == "act":
            return json.dumps(await law.act(value), ensure_ascii=False, indent=1)
        if command == "text":
            return await law.text(value)
        return json.dumps(await law.nearest(value), ensure_ascii=False, indent=1)


def main() -> int:
    parser = argparse.ArgumentParser(prog="pjolroll", description=__doc__.splitlines()[0])
    parser.add_argument("command", choices=["tools", "act", "text", "nearest", "ask"])
    parser.add_argument("value", nargs="*")
    parser.add_argument("--escalate", action="store_true")
    parser.add_argument("--hard", action="store_true")
    arguments = parser.parse_args()
    value = " ".join(arguments.value)
    if arguments.command != "tools" and not value:
        parser.error(f"{arguments.command} needs a value")
    try:
        if arguments.command == "ask":
            advice = Mastermind().ask(value, escalate=arguments.escalate, hard=arguments.hard)
            print(advice.get("answer", ""))
            for one in advice.get("cited", []):
                print(f"  [{one['ELI']}] {'read' if one['read'] else 'NOT READ'}")
            print(f"{advice.get('model')}. Not legal advice.")
        else:
            print(asyncio.run(read(arguments.command, value)))
    except (LawError, MastermindError) as error:
        print(error, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())

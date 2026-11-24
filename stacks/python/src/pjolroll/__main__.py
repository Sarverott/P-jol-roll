"""The stack from a terminal (task python:law -- ...):

pjolroll tools                       the tools of the MCP server
pjolroll act DU/1918/2               the details of an act
pjolroll text DU/1918/2              its text
pjolroll nearest "Rada Stanu"        the acts nearest by meaning
pjolroll ask "..." [--escalate|--hard]   the mastermind of a running api (API_URL)
pjolroll simulate DU/1997/939 [--rounds 3] [--personas 6]   the simulation bubble (phase 36)
pjolroll propose DU/1997/939         improvements proposed by a model (phase 36)
"""

from __future__ import annotations

import argparse
import asyncio
import json
import sys

import httpx2

from pjolroll.law import Law, LawError
from pjolroll.mastermind import Mastermind, MastermindError
from pjolroll.model import Model
from pjolroll.proposals import propose
from pjolroll.simulation import personas, simulate


async def read(command: str, value: str) -> str:
    async with Law.open() as law:
        if command == "tools":
            return "\n".join(await law.tools())
        if command == "act":
            return json.dumps(await law.act(value), ensure_ascii=False, indent=1)
        if command == "text":
            return await law.text(value)
        return json.dumps(await law.nearest(value), ensure_ascii=False, indent=1)


def show(post: dict) -> None:
    print(f"  [{post['round']}] {post['name']} ({post['stance']}): {post['post']}", flush=True)


async def bubble(eli: str, rounds: int, people: int) -> str:
    async with Law.open() as law:
        model = Model()
        print(f"{eli}: {people or 'every'} person(s), {rounds} round(s), {model.name}", flush=True)
        run = await simulate(
            law, eli, rounds=rounds, people=personas(people), model=model, on_post=show
        )
    changed = ", ".join(run["changed"]) or "nobody"
    return f"\n{run['tally']}; changed their mind: {changed}. Kept: {run['record']}"


async def proposals(eli: str) -> str:
    async with Law.open() as law:
        done = await propose(law, eli)
    return f"{done['text']}\n\n{done['model']} from {', '.join(done['sources'])}. Kept: {done['record']}. Not (formally) legal advices."


def main() -> int:
    parser = argparse.ArgumentParser(prog="pjolroll", description=__doc__.splitlines()[0])
    parser.add_argument(
        "command", choices=["tools", "act", "text", "nearest", "ask", "simulate", "propose"]
    )
    parser.add_argument("value", nargs="*")
    parser.add_argument("--escalate", action="store_true")
    parser.add_argument("--hard", action="store_true")
    parser.add_argument("--rounds", type=int, default=3)
    parser.add_argument("--personas", type=int, default=0, help="the first N of personas.yaml")
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
            print(f"{advice.get('model')}. Not (formally) legal advices.")
        elif arguments.command == "simulate":
            print(asyncio.run(bubble(value, arguments.rounds, arguments.personas)))
        elif arguments.command == "propose":
            print(asyncio.run(proposals(value)))
        else:
            print(asyncio.run(read(arguments.command, value)))
    except (LawError, MastermindError, ValueError, httpx2.HTTPError) as error:
        print(error, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())

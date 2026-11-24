"""The law through the MCP server of this repository over stdio, reading a year of three acts
written here (as tests/mastermind.test.ts does) - never the source, never the real resources/."""

import asyncio
import json

import pytest

from pjolroll import Law, LawError


def run(reading):
    async def go():
        async with Law.open() as law:
            return await reading(law)

    return asyncio.run(go())


def test_the_tools_of_the_server():
    tools = run(lambda law: law.tools())
    assert {"act", "act_text", "search_acts", "search_meaning"} <= set(tools)


def test_an_act_its_text_and_a_search():
    async def reading(law):
        return (
            await law.act("DU/1918/2"),
            await law.text("DU/1918/2"),
            await law.search("DU", 1918, query="szkoł"),
        )

    act, text, found = run(reading)
    assert act["act"]["title"] == "Ustawa o Radzie Stanu"
    assert "Art. 1. Tekst aktu 2." in text
    assert "DU/1918/3" in json.dumps(found)
    assert "DU/1918/2" not in json.dumps(found)


def test_an_act_not_gathered_is_an_error():
    with pytest.raises(LawError):
        run(lambda law: law.act("DU/1918/99"))

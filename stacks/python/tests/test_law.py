"""The law through the MCP server of this repository over stdio, reading a year of three acts
written here (as tests/mastermind.test.ts does) - never the source, never the real resources/."""

import asyncio
import json

import pytest

from pjolroll import Law, LawError

TITLES = ["Dekret o Radzie Regencyjnej", "Ustawa o Radzie Stanu", "Dekret o szkołach"]


@pytest.fixture(scope="module", autouse=True)
def resources(tmp_path_factory):
    root = tmp_path_factory.mktemp("resources")
    acts = [
        {
            "ELI": f"DU/1918/{pos}",
            "address": f"WDU1918000{pos}000{pos}",
            "publisher": "DU",
            "year": 1918,
            "pos": pos,
            "title": TITLES[pos - 1],
            "type": "Ustawa" if pos == 2 else "Dekret",
            "status": "uchylony",
            "textPDF": False,
            "textHTML": True,
        }
        for pos in (1, 2, 3)
    ]
    (root / "dataset/acts/DU").mkdir(parents=True)
    (root / "dataset/acts/DU/1918.jsonl").write_text(
        "".join(json.dumps(act, ensure_ascii=False) + "\n" for act in acts)
    )
    (root / "dataset/lists").mkdir(parents=True)
    (root / "dataset/lists/publishers.json").write_text(
        json.dumps([{"code": "DU", "name": "Dziennik Ustaw"}])
    )
    (root / "dataset/texts/DU/1918").mkdir(parents=True)
    for act in acts:
        (root / f"dataset/texts/DU/1918/{act['address']}.md").write_text(
            f"# {act['title']}\n\nArt. 1. Tekst aktu {act['pos']}.\n"
        )
    with pytest.MonkeyPatch.context() as patch:
        patch.setenv("RESOURCES_DIR", str(root))
        patch.setenv("WEB_DIR", str(root / "no-web"))
        patch.delenv("MCP_URL", raising=False)
        yield root


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

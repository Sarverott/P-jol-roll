"""A year of three acts written for the tests (as tests/mastermind.test.ts does), read by the MCP
server of this repository over stdio - never the source, never the real resources/."""

import json

import pytest

TITLES = ["Dekret o Radzie Regencyjnej", "Ustawa o Radzie Stanu", "Dekret o szkołach"]


@pytest.fixture(scope="session", autouse=True)
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

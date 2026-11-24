"""The simulation bubble and the proposals (phase 36) against a stand-in of the model's api, the
act read through the MCP server over stdio from the dataset of conftest.py."""

import asyncio
import json
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import pytest

from pjolroll import Law
from pjolroll.model import Model, first_json
from pjolroll.proposals import propose
from pjolroll.simulation import personas, simulate, simulations

asked: list[dict] = []


class StandIn(BaseHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers["content-length"])))
        asked.append(body)
        system, user = body["messages"][0]["content"], body["messages"][1]["content"]
        if "legislatorem" in system:
            content = "## Art. 1\nProblem i propozycja. To nie jest porada prawna."
        elif "Halina" in system:
            # she changes her mind in the second round, thinking first and fencing the JSON
            stance = "przeciw" if "Dyskusja dotąd" in user else "za"
            content = (
                f'<think>hm</think>Oto wpis:\n```json\n{{"stance": "{stance}", '
                f'"post": "Moja emerytura.", "reply_to": null}}\n```'
            )
        else:
            content = "nie umiem w JSON, ale jestem przeciw"
        data = json.dumps({"choices": [{"message": {"content": content}}]}).encode()
        self.send_response(200)
        self.send_header("content-type", "application/json")
        self.send_header("content-length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


@pytest.fixture(scope="module")
def model():
    server = ThreadingHTTPServer(("127.0.0.1", 0), StandIn)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    yield Model(url=f"http://127.0.0.1:{server.server_address[1]}/v1", name="stand-in")
    server.shutdown()


def test_the_json_a_small_model_wraps_in_words():
    assert first_json('tak: {"a": {"b": 1}} i {"c": 2}') == {"a": {"b": 1}}
    assert first_json("nic tu nie ma") is None


def test_people_talk_about_an_act_in_rounds(model):
    people = personas(2)
    assert [one["name"] for one in people] == ["Halina", "Kacper"]

    async def run():
        async with Law.open() as law:
            return await simulate(law, "DU/1918/2", rounds=2, people=people, model=model)

    run_ = asyncio.run(run())
    assert [(post["round"], post["name"], post["stance"]) for post in run_["posts"]] == [
        (1, "Halina", "za"),
        (1, "Kacper", "nie wiem"),  # no JSON: its words kept, its stance unknown
        (2, "Halina", "przeciw"),
        (2, "Kacper", "nie wiem"),
    ]
    assert run_["posts"][0]["post"] == "Moja emerytura."
    assert run_["tally"] == {"za": 0, "przeciw": 1, "nie wiem": 1}
    assert run_["changed"] == ["Halina"]
    assert run_["act"]["title"] == "Ustawa o Radzie Stanu"
    # the second round reads the first; the act's text reached them through MCP
    second = asked[-1]["messages"][1]["content"]
    assert "#0 Halina (za): Moja emerytura." in second
    assert "Art. 1. Tekst aktu 2." in second
    assert Path(run_["record"]).exists()
    assert [one["UNIXUSAT"] for one in simulations("DU/1918/2")] == [run_["UNIXUSAT"]]


def test_improvements_proposed_from_the_act_and_its_simulation(model):
    async def run():
        async with Law.open() as law:
            return await propose(law, "DU/1918/2", model=model)

    done = asyncio.run(run())
    assert done["text"].startswith("## Art. 1")
    given = asked[-1]["messages"][1]["content"]
    assert "Ustawa o Radzie Stanu" in given
    assert "Głosy z symulacji" in given and "Halina (przeciw)" in given
    kept = Path(done["record"]).read_text(encoding="utf-8")
    assert "Not legal advice." in kept and "1 simulation(s)" in kept


def test_not_an_eli_is_refused(model):
    async def run():
        async with Law.open() as law:
            return await simulate(law, "../etc", model=model)

    with pytest.raises(ValueError):
        asyncio.run(run())


def test_a_broken_object_is_read_field_by_field():
    from pjolroll.simulation import said

    broken = '```json\n{"stance": "przeciw", "post": "Te "czynności bankowe" - po co?", "reply_to": 0}\n```'
    assert said(broken) == {
        "stance": "przeciw",
        "post": 'Te "czynności bankowe" - po co?',
        "reply_to": None,
    }

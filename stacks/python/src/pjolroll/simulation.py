"""The simulation bubble (phase 36): how a change of law meets people, offline.

People of different lives (resources/configs/simulations/personas.yaml) read an act - what MCP
gives of it: its title and status, the beginning of its text, what the analysis found, what was
said of it in Sejm - and talk about it, round after round: in the first each says where they
stand and why, in the next ones each reads what the others wrote and answers or changes their
mind. Each of them is a model of the host's Ollama (model.py). Every run is kept:

    resources/simulations/<journal>/<year>/<position>/<UNIXUSAT>.json

The project's own bubble rather than OASIS or MiroFish: those bring torch, sentence-transformers
and neo4j, and simulate a social network; this one is small and keeps every word said.
Invented people, a model's words: a way to see an act from where it lands, not a survey.
"""

from __future__ import annotations

import json
import os
import re
import time
from pathlib import Path
from typing import Any

import yaml

from pjolroll.law import ROOT, Law, LawError
from pjolroll.model import Model, first_json

STANCES = ("za", "przeciw", "nie wiem")
ELI = re.compile(r"^(DU|MP)/(\d{4})/(\d+)$")


def resources() -> Path:
    return Path(os.environ.get("RESOURCES_DIR") or ROOT / "resources")


def personas(limit: int = 0, path: Path | None = None) -> list[dict[str, Any]]:
    path = path or ROOT / "resources/configs/simulations/personas.yaml"
    people = yaml.safe_load(path.read_text(encoding="utf-8"))["personas"]
    return people[:limit] if limit else people


async def brief(law: Law, eli: str, length: int = 4000) -> dict[str, Any]:
    """What MCP gives of an act for people to read: details, text, findings, debates."""
    view = await law.act(eli)
    act = view.get("act", {})
    # the law in force is its newest consolidated text (an announcement of its own), when it has
    # one whose text is here; else the act as it was published
    ties = json.loads(await law.call("act_references", eli=eli))
    consolidated = sorted(
        (tie["to"] for tie in ties if tie.get("type") == "Inf. o tekście jednolitym"),
        key=lambda one: tuple(int(part) for part in one.split("/")[1:]),
        reverse=True,
    )
    text, text_of = "", ""
    for source in [*consolidated, eli]:
        try:
            text = await law.text(source, length=max(1000, length))
        except LawError:
            continue
        text_of = source
        break
    findings = json.loads(await law.call("analysis", eli=eli))
    debates = json.loads(await law.call("act_debates", eli=eli))
    said = [
        f"{one['name']} ({one.get('function', '')} {one.get('club', '')}): {one.get('text', '')}"
        for day in debates.get("days", [])
        for one in day.get("statements", [])
        if one.get("about")
    ][:5]
    return {
        "ELI": eli,
        "title": act.get("title", eli),
        "status": act.get("status", ""),
        "text": text[:length],
        "text_of": text_of,  # the consolidated text it was read from, or the act itself
        "findings": [one["proposal"] for one in findings] if isinstance(findings, list) else [],
        "debates": said,
    }


def read_as(person: dict[str, Any]) -> str:
    return (
        f"Jesteś {person['name']}, {person['age']} lat, {person['occupation']}, {person['place']}. "
        f"{person['about']}. To symulacja: mówisz jako ta osoba, po polsku, szczerze i krótko "
        "(2-4 zdania), o tym, jak ten akt prawny dotyka twojego życia. Odpowiedz tylko obiektem "
        'JSON: {"stance": "za" albo "przeciw" albo "nie wiem", "post": "twój wpis", '
        '"reply_to": numer wpisu, na który odpowiadasz, albo null}'
    )


def the_act(act: dict[str, Any]) -> str:
    parts = [f"Akt: {act['title']} ({act['ELI']}), status: {act['status'] or 'nieznany'}."]
    if act["text"]:
        of = act.get("text_of", act["ELI"])
        source = "tekstu" if of == act["ELI"] else f"tekstu jednolitego ({of})"
        parts.append(f"Początek {source}:\n{act['text']}")
    if act["findings"]:
        parts.append("Co znalazła analiza przepisów:\n- " + "\n- ".join(act["findings"]))
    if act["debates"]:
        parts.append("Co mówiono o nim w Sejmie:\n- " + "\n- ".join(act["debates"]))
    return "\n\n".join(parts)


FIELD = {
    "stance": re.compile(r'"stance"\s*:\s*"(za|przeciw|nie wiem)"', re.IGNORECASE),
    "post": re.compile(r'"post"\s*:\s*"(.*?)"\s*(?:,\s*"reply_to"|}\s*$)', re.DOTALL),
}


def said(text: str) -> dict[str, Any]:
    # JSON as asked; else its fields one by one (a quote left unescaped inside the post breaks
    # the whole object), else the words as they are
    value = first_json(text) or {
        name: found.group(1) for name, pattern in FIELD.items() if (found := pattern.search(text))
    }
    stance = str(value.get("stance", "")).strip().lower()
    reply = value.get("reply_to")
    return {
        "stance": stance if stance in STANCES else "nie wiem",
        "post": str(value.get("post") or text).strip()[:1500],
        "reply_to": reply if isinstance(reply, int) else None,
    }


async def simulate(
    law: Law,
    eli: str,
    *,
    rounds: int = 3,
    people: list[dict[str, Any]] | None = None,
    model: Model | None = None,
    keep: bool = True,
    on_post=lambda post: None,
) -> dict[str, Any]:
    if not ELI.match(eli):
        raise ValueError(f"not an ELI: {eli}")
    started = int(time.time() * 1000)
    model = model or Model()
    people = people if people is not None else personas()
    act = await brief(law, eli)
    posts: list[dict[str, Any]] = []
    for round_ in range(1, rounds + 1):
        feed = "\n".join(
            f"#{index} {one['name']} ({one['stance']}): {one['post']}"
            for index, one in enumerate(posts)
        )
        ask = the_act(act) + (
            f"\n\nDyskusja dotąd:\n{feed}\n\nNapisz kolejny wpis: odpowiedz komuś albo zmień zdanie, "
            "jeśli cię przekonano."
            if feed
            else "\n\nNapisz pierwszy wpis: gdzie stoisz i dlaczego."
        )
        for person in people:
            post = {
                "round": round_,
                "name": person["name"],
                **said(model.chat(read_as(person), ask, json=True)),
            }
            posts.append(post)
            on_post(post)
    last = {post["name"]: post["stance"] for post in posts}
    first = {post["name"]: post["stance"] for post in reversed(posts)}
    run = {
        "UNIXUSAT": started,
        "date": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(started / 1000)),
        "seconds": round(time.time() - started / 1000, 1),
        "act": act,
        "model": model.name,
        "url": model.url,
        "rounds": rounds,
        "personas": people,
        "posts": posts,
        "tally": {stance: list(last.values()).count(stance) for stance in STANCES},
        "changed": sorted(name for name in last if last[name] != first[name]),
        "record": "",
    }
    if keep:
        journal, year, position = ELI.match(eli).groups()
        path = resources() / "simulations" / journal / year / position / f"{started}.json"
        path.parent.mkdir(parents=True, exist_ok=True)
        run["record"] = str(path)
        path.write_text(json.dumps(run, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    return run


def simulations(eli: str) -> list[dict[str, Any]]:
    """The runs kept for an act, the newest last."""
    match = ELI.match(eli)
    if not match:
        return []
    folder = resources() / "simulations" / Path(*match.groups())
    return [
        json.loads(path.read_text(encoding="utf-8"))
        for path in sorted(folder.glob("*.json"), key=lambda one: int(one.stem))
    ]

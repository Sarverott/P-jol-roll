"""Improvements proposed (phase 36): a model reads an act through MCP - its text, what the analysis
found, what was said of it in Sejm - and what people said of it in the simulations kept here, and
writes what could be improved, provision by provision. Kept as markdown:

    resources/proposals/<journal>/<year>/<position>/<UNIXUSAT>.md

PROPOSE_MODEL names its model, qwen3:8b by default, through SIMULATION_URL. A model's proposals, grounded in what it was given and checked by nobody: not (formally) legal advices.
"""

from __future__ import annotations

import os
import time
from typing import Any

from pjolroll.law import Law
from pjolroll.model import Model
from pjolroll.simulation import ELI, brief, resources, simulations

SYSTEM = (
    "Jesteś legislatorem. Twoje zadanie: PROPOZYCJE ZMIAN obowiązującego aktu prawnego - nie "
    "streszczenie ani objaśnienie dla obywateli. Opierasz się wyłącznie na tym, co dostałeś: "
    "tekst aktu, ustalenia analizy przepisów, wypowiedzi w Sejmie i głosy ludzi z symulacji. "
    "Zacznij od ustaleń analizy: każde z nich to osobna propozycja (np. odesłanie do aktu "
    "uchylonego - na co je zmienić; potrzeba tekstu jednolitego). Potem propozycje z treści "
    "przepisów i z głosów ludzi. Piszesz po polsku, w markdown, każda propozycja jako: "
    "### nagłówek, Przepis (art., ust. - albo cały akt), Problem, Propozycja zmiany, Podstawa "
    "(numer ustalenia analizy albo artykuł z tekstu powyżej - nic innego, żadnych innych "
    "ustaw ani dzienników). Każde ustalenie raz. Nie wymyślaj przepisów, których nie widzisz "
    "w tekście; gdy czegoś nie wiesz, napisz to. Na końcu jedno zdanie: nie jest to "
    "(formalnie) porada prawna."
)


def context(act: dict[str, Any], runs: list[dict[str, Any]]) -> str:
    parts = [f"# {act['title']} ({act['ELI']})", f"Status: {act['status'] or 'nieznany'}"]
    of = act.get("text_of") or act["ELI"]
    heading = "Tekst (początek)" if of == act["ELI"] else f"Tekst jednolity {of} (początek)"
    parts.append(f"## {heading}\n{act['text'] or '(tekst nie jest zebrany)'}")
    if act["findings"]:
        parts.append("## Ustalenia analizy przepisów\n- " + "\n- ".join(act["findings"]))
    if act["debates"]:
        parts.append("## W Sejmie\n- " + "\n- ".join(act["debates"]))
    if runs:
        last = runs[-1]
        voices = [
            f"{post['name']} ({post['stance']}): {post['post']}"
            for post in last["posts"]
            if post["round"] == last["rounds"]
        ]
        parts.append(
            f"## Głosy z symulacji ({last['date']}, {last['tally']})\n- " + "\n- ".join(voices)
        )
    # the task said again at the end, where a small model still looks: the findings numbered
    task = ["## Zadanie", "Napisz propozycje zmian tego aktu, w tej kolejności:"]
    task += [f"{index}. {one}" for index, one in enumerate(act["findings"], 1)]
    task.append(
        f"{len(act['findings']) + 1}. Co jeszcze w treści przepisów i w głosach ludzi wymaga zmiany."
    )
    task.append("Każda jako: ### nagłówek, Przepis, Problem, Propozycja zmiany, Podstawa.")
    parts.append("\n".join(task))
    return "\n\n".join(parts)


async def propose(
    law: Law, eli: str, *, model: Model | None = None, keep: bool = True, length: int = 12000
) -> dict[str, Any]:
    if not ELI.match(eli):
        raise ValueError(f"not an ELI: {eli}")
    started = int(time.time() * 1000)
    # qwen3:8b followed the findings one by one where ministral-3:8b wrote an explainer (phase 36)
    model = model or Model(name=os.environ.get("PROPOSE_MODEL") or "qwen3:8b")
    act = await brief(law, eli, length=length)
    runs = simulations(eli)
    written = model.chat(SYSTEM, context(act, runs), temperature=0.3, words=2500)
    sources = [
        (f"the text of {act['text_of']} through MCP" if act["text"] else "no text"),
        f"{len(act['findings'])} finding(s) of task analyse",
        f"{len(act['debates'])} statement(s) in Sejm",
        f"{len(runs)} simulation(s)",
    ]
    document = (
        f"<!-- {model.name}, {time.strftime('%Y-%m-%d', time.gmtime(started / 1000))}: "
        f"{', '.join(sources)}. Not (formally) legal advices. -->\n\n{written}\n"
    )
    path = ""
    if keep:
        journal, year, position = ELI.match(eli).groups()
        target = resources() / "proposals" / journal / year / position / f"{started}.md"
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(document, encoding="utf-8")
        path = str(target)
    return {"ELI": eli, "model": model.name, "sources": sources, "text": written, "record": path}

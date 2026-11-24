"""A model of an OpenAI-like api - the host's Ollama (its /v1) in development - for the simulations
and the proposals (phase 36). The law itself never comes from here: it is read through MCP.

    SIMULATION_URL     http://127.0.0.1:11434/v1
    SIMULATION_MODEL   ministral-3:8b (fast, clear Polish in the comparison of phase 31)
    SIMULATION_KEY     a key, when the api wants one
"""

from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass, field

import httpx2

THINKING = re.compile(r"<think>.*?</think>", re.DOTALL)


@dataclass
class Model:
    url: str = field(
        default_factory=lambda: os.environ.get("SIMULATION_URL", "http://127.0.0.1:11434/v1")
    )
    name: str = field(default_factory=lambda: os.environ.get("SIMULATION_MODEL", "ministral-3:8b"))
    key: str = field(default_factory=lambda: os.environ.get("SIMULATION_KEY", ""))
    timeout: float = 600.0

    def chat(
        self,
        system: str,
        user: str,
        *,
        temperature: float = 0.8,
        words: int = 700,
        json: bool = False,
    ) -> str:
        """What the model says, its thinking (<think>...</think>) left out."""
        answer = httpx2.post(
            f"{self.url.rstrip('/')}/chat/completions",
            headers={"authorization": f"Bearer {self.key}"} if self.key else {},
            json={
                "model": self.name,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                "temperature": temperature,
                "max_tokens": words,
                # JSON mode where the api has it (Ollama's /v1 does): an object, nothing around it
                **({"response_format": {"type": "json_object"}} if json else {}),
            },
            timeout=self.timeout,
        )
        answer.raise_for_status()
        content = answer.json()["choices"][0]["message"].get("content") or ""
        return THINKING.sub("", content).strip()


def first_json(text: str) -> dict | None:
    """The first JSON object in what a model wrote (small models wrap it in words or fences)."""
    for start in [index for index, sign in enumerate(text) if sign == "{"]:
        depth = 0
        for end in range(start, len(text)):
            depth += {"{": 1, "}": -1}.get(text[end], 0)
            if depth == 0:
                try:
                    value = json.loads(text[start : end + 1])
                except json.JSONDecodeError:
                    break
                return value if isinstance(value, dict) else None
    return None

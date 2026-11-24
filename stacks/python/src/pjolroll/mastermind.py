"""The law mastermind through the api (/api/ask, src/openapi/ask.ts): the models of the host answer,
reading the acts through the MCP tools and citing them by ELI. The simulations ask it as people
would, and never a model of their own about the law.

    API_URL   http://127.0.0.1:8080 (task serve with MASTERMIND_URL), :8081 of compose
"""

from __future__ import annotations

import os
from typing import Any

import httpx2


class MastermindError(RuntimeError):
    """The api did not answer: no mastermind there, busy, or the model failed."""


class Mastermind:
    def __init__(self, url: str | None = None, timeout: float = 900.0) -> None:
        self.url = (url or os.environ.get("API_URL") or "http://127.0.0.1:8080").rstrip("/")
        self.timeout = timeout

    def about(self) -> dict[str, Any]:
        """Whether the host answers, its model, and the deepseek of hard questions it offers."""
        return httpx2.get(f"{self.url}/api/ask/about", timeout=30).json()

    def ask(self, question: str, *, escalate: bool = False, hard: bool = False) -> dict[str, Any]:
        """The answer (the Advice of the api): answer, thinking, cited, steps, model, escalated...

        escalate: a weak answer goes on to the deepseek hosted by Hugging Face (phase 34)
        hard:     straight to it
        """
        params = {"question": question}
        if hard:
            params["hard"] = "1"
        elif escalate:
            params["escalate"] = "1"
        answer = httpx2.get(f"{self.url}/api/ask", params=params, timeout=self.timeout)
        body = (
            answer.json()
            if answer.headers.get("content-type", "").startswith("application/json")
            else {}
        )
        if answer.status_code != 200:
            raise MastermindError(body.get("error") or f"the api answered {answer.status_code}")
        return body

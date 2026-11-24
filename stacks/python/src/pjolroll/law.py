"""The law through the project's own MCP tools (src/mcp): the same reading as the api, the viewer
and the mastermind - read-only, from resources/ only, never the source.

    MCP_URL unset   the server over stdio, started here: npx tsx src/mcp/main.ts in the repository
    MCP_URL=...     a running one over http: /mcp of task serve, of compose, or of the demo space
"""

from __future__ import annotations

import json
import os
from collections.abc import AsyncIterator
from contextlib import AsyncExitStack, asynccontextmanager
from pathlib import Path
from typing import Any

import httpx2
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from mcp.client.streamable_http import streamable_http_client

# stacks/python/src/pjolroll/law.py -> the repository
ROOT = Path(__file__).resolve().parents[4]


class LawError(RuntimeError):
    """A tool answered with an error: an act not gathered, an argument it does not take."""


def _leaves(group: BaseExceptionGroup) -> list[BaseException]:
    return [
        leaf
        for one in group.exceptions
        for leaf in (_leaves(one) if isinstance(one, BaseExceptionGroup) else [one])
    ]


class Law:
    """One conversation with the MCP server; open it with ``Law.open()``."""

    def __init__(self, session: ClientSession) -> None:
        self.session = session

    @classmethod
    @asynccontextmanager
    async def open(
        cls, url: str | None = None, headers: dict[str, str] | None = None
    ) -> AsyncIterator[Law]:
        url = url if url is not None else os.environ.get("MCP_URL", "")
        try:
            async with cls._connected(url, headers) as law:
                yield law
        except BaseExceptionGroup as group:
            # the tasks of the session wrap what was raised inside; one error is given as it is
            leaves = _leaves(group)
            if len(leaves) == 1 and isinstance(leaves[0], Exception):
                raise leaves[0] from None
            raise

    @classmethod
    @asynccontextmanager
    async def _connected(cls, url: str, headers: dict[str, str] | None) -> AsyncIterator[Law]:
        async with AsyncExitStack() as stack:
            if url:
                client = await stack.enter_async_context(httpx2.AsyncClient(headers=headers))
                read, write = await stack.enter_async_context(
                    streamable_http_client(url, http_client=client)
                )
            else:
                # the server of this repository, reading its resources/ (RESOURCES_DIR as set)
                server = StdioServerParameters(
                    command="npx",
                    args=["tsx", "src/mcp/main.ts"],
                    cwd=str(ROOT),
                    env={**os.environ},
                )
                read, write = await stack.enter_async_context(stdio_client(server))
            session = await stack.enter_async_context(ClientSession(read, write))
            await session.initialize()
            yield cls(session)

    async def tools(self) -> list[str]:
        return [tool.name for tool in (await self.session.list_tools()).tools]

    async def call(self, name: str, **arguments: Any) -> str:
        """A tool's answer as its text; an error of the tool raised as LawError."""
        result = await self.session.call_tool(name, arguments)
        text = "\n".join(getattr(part, "text", "") for part in result.content)
        if result.is_error:
            raise LawError(f"{name}: {text}")
        return text

    async def _json(self, name: str, **arguments: Any) -> Any:
        return json.loads(await self.call(name, **arguments))

    async def act(self, eli: str) -> dict[str, Any]:
        """One act: "DU/1918/2" - {act, details, files, markdown, text}."""
        return await self._json("act", eli=eli)

    async def text(self, eli: str, start: int = 0, length: int = 20000) -> str:
        """The text of an act as markdown, a piece of it."""
        return await self.call("act_text", eli=eli, start=start, length=length)

    async def references(self, eli: str) -> Any:
        return await self._json("act_references", eli=eli)

    async def search(self, journal: str, year: int, query: str = "", limit: int = 20) -> Any:
        """The acts of a year whose title has the query."""
        return await self._json("search_acts", journal=journal, year=year, query=query, limit=limit)

    async def nearest(self, question: str, journal: str = "", limit: int = 10) -> list[dict]:
        """The acts nearest to a question by meaning (the vectors of task embed)."""
        return await self._json("search_meaning", question=question, journal=journal, limit=limit)

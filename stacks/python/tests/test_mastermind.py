"""The mastermind through /api/ask, against a stand-in of the api."""

import json
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

import pytest

from pjolroll import Mastermind, MastermindError

heard: list[dict] = []


class StandIn(BaseHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def do_GET(self):
        address = urlparse(self.path)
        query = {key: values[0] for key, values in parse_qs(address.query).items()}
        heard.append({"path": address.path, **query})
        if address.path == "/api/ask/about":
            status, body = 200, {"answers": True, "model": "qwen3:8b", "hard": "deepseek"}
        elif query.get("question") == "busy":
            status, body = 429, {"error": "your previous question is still being answered"}
        else:
            status, body = (
                200,
                {
                    "answer": "Rada Stanu doradzała [DU/1918/2].",
                    "cited": [{"ELI": "DU/1918/2", "read": True}],
                    "model": "deepseek-ai/DeepSeek-R1-0528" if "escalate" in query else "qwen3:8b",
                },
            )
        data = json.dumps(body).encode()
        self.send_response(status)
        self.send_header("content-type", "application/json")
        self.send_header("content-length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


@pytest.fixture(scope="module")
def api():
    server = ThreadingHTTPServer(("127.0.0.1", 0), StandIn)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    yield Mastermind(f"http://127.0.0.1:{server.server_address[1]}")
    server.shutdown()


def test_asked_and_escalated(api):
    assert api.about()["hard"] == "deepseek"
    advice = api.ask("Czym była Rada Stanu?", escalate=True)
    assert advice["model"] == "deepseek-ai/DeepSeek-R1-0528"
    assert advice["cited"] == [{"ELI": "DU/1918/2", "read": True}]
    assert heard[-1] == {"path": "/api/ask", "question": "Czym była Rada Stanu?", "escalate": "1"}
    api.ask("Czym była Rada Stanu?", hard=True)
    assert heard[-1]["hard"] == "1" and "escalate" not in heard[-1]


def test_what_the_api_refused_is_an_error(api):
    with pytest.raises(MastermindError, match="still being answered"):
        api.ask("busy")

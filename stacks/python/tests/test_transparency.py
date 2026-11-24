"""The declaration of transparency (phase 44) against stand-ins of dane.gov.pl and Nominatim."""

import json
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import pytest

from pjolroll import transparency

CSV = (
    "L.p.;NAZWA URZĘDU;WOJEWÓDZTWO;POWIAT;MIEJSCOWOŚĆ;ULICA;NR DOMU;KOD POCZTOWY;"
    "NR TELEFONU wraz z nr kierunkowym;NR FAXU wraz z nr kierunkowym;ADRES E-MAIL URZĘDU;"
    "ADRES WWW URZĘDU;SZEROKOŚĆ GEOGRAFICZNA;DŁUGOŚĆ GEOGRAFICZNA\n"
    "1.;Dolnośląski Urząd Wojewódzki we Wrocławiu;dolnośląskie;;Wrocław;pl. Powstańców Warszawy;1;"
    "50-153;71 340 60 00;71 340 68 95;info@duw.pl ;http://www.duw.pl/;51,11;17,0496\n"
    "2.;Urząd bez miejsca;lubelskie;;Lublin;Spokojna;4;20-074;81 742 41 00;;kancelaria@lublin.uw.gov.pl;;;\n"
)
asked: list[str] = []


class StandIn(BaseHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def do_GET(self):
        address = urlparse(self.path)
        asked.append(address.path)
        port = self.server.server_address[1]
        if address.path == "/api/resources/1":
            body = json.dumps(
                {"data": {"attributes": {"download_url": f"http://127.0.0.1:{port}/file/1"}}}
            ).encode()
        elif address.path == "/file/1":
            body = CSV.encode("cp1250")
        elif address.path == "/ripe/search":
            query = parse_qs(address.query)["q"][0]
            orgs = (
                [("ORG-MI1-RIPE", "MINISTERSTWO INFRASTRUKTURY", "PL")]
                if "gov.pl" in query
                else [
                    ("ORG-X1-RIPE", "URZAD GMINY X", "PL"),
                    ("ORG-DE1-RIPE", "URZAD IN GERMANY", "DE"),
                ]
            )
            body = json.dumps(
                {
                    "result": {
                        "numFound": len(orgs),
                        "docs": [
                            {
                                "doc": {
                                    "strs": [
                                        {"str": {"name": "organisation", "value": k}},
                                        {"str": {"name": "org-name", "value": n}},
                                        {"str": {"name": "country", "value": c}},
                                        {
                                            "str": {
                                                "name": "e-mail",
                                                "value": "a.person@example.gov.pl",
                                            }
                                        },
                                    ]
                                }
                            }
                            for k, n, c in orgs
                        ],
                    }
                }
            ).encode()
        elif address.path == "/rest/search.json":
            key = parse_qs(address.query)["query-string"][0]
            if key != "ORG-MI1-RIPE":
                self.send_response(404)
                self.end_headers()
                return
            body = json.dumps(
                {
                    "objects": {
                        "object": [
                            {
                                "type": "inetnum",
                                "attributes": {
                                    "attribute": [
                                        {"name": "inetnum", "value": "193.23.63.0 - 193.23.63.255"},
                                        {"name": "netname", "value": "MINISTERSTWO-INFRASTRUKTURY"},
                                    ]
                                },
                            },
                            {
                                "type": "aut-num",
                                "attributes": {
                                    "attribute": [
                                        {"name": "aut-num", "value": "AS211375"},
                                        {"name": "as-name", "value": "AS_MI_RIPE"},
                                    ]
                                },
                            },
                        ]
                    }
                }
            ).encode()
        elif address.path == "/osm/search":
            query = parse_qs(address.query)
            assert query["street"] == ["Spokojna 4"]
            assert (query["city"], query["postalcode"]) == (["Lublin"], ["20-074"])
            body = json.dumps(
                [{"lat": "51.25", "lon": "22.56", "osm_type": "way", "osm_id": 7}]
            ).encode()
        else:
            self.send_response(404)
            self.end_headers()
            return
        self.send_response(200)
        self.end_headers()
        self.wfile.write(body)


@pytest.fixture()
def stand_in(monkeypatch, tmp_path):
    server = ThreadingHTTPServer(("127.0.0.1", 0), StandIn)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{server.server_address[1]}"
    monkeypatch.setattr(transparency, "API", f"{base}/api")
    monkeypatch.setattr(transparency, "NOMINATIM", f"{base}/osm")
    monkeypatch.setattr(transparency, "RIPE_SEARCH", f"{base}/ripe/search")
    monkeypatch.setattr(transparency, "RIPE_REST", f"{base}/rest")
    monkeypatch.setattr(transparency.time, "sleep", lambda _: None)
    monkeypatch.setenv("RESOURCES_DIR", str(tmp_path))
    sources = tmp_path / "sources.yaml"
    sources.write_text(
        "sources:\n  - {resource: 1, kind: administracja zespolona}\n"
        "ripe:\n  domains: [gov.pl]\n  words: [Urzad]\n"
    )
    yield sources
    server.shutdown()


def test_columns_told_by_their_words():
    assert transparency.field_of("NR TELEFONU wraz z nr kierunkowym") == "phones"
    assert transparency.field_of("ADRES E-MAIL URZĘDU") == "emails"
    assert transparency.field_of("NR FAXU") == "fax"
    assert transparency.field_of("SZEROKOŚĆ GEOGRAFICZNA") == "latitude"
    assert transparency.field_of("NAZWA URZĘDU") == "name"
    assert transparency.field_of("L.p.") is None


def test_offices_read_and_placed(stand_in):
    assert transparency.offices(stand_in) == {"administracja zespolona": 2}
    path = Path(transparency.resources()) / "dataset/transparency/offices.jsonl"
    rows = [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines()]
    assert rows[0] | {"source": ""} == {
        "name": "Dolnośląski Urząd Wojewódzki we Wrocławiu",
        "kind": "administracja zespolona",
        "voivodeship": "dolnośląskie",
        "district": "",
        "city": "Wrocław",
        "street": "pl. Powstańców Warszawy",
        "number": "1",
        "postal": "50-153",
        "country": "",
        "phones": ["71 340 60 00"],
        "fax": ["71 340 68 95"],
        "emails": ["info@duw.pl"],
        "www": "http://www.duw.pl/",
        "epuap": "",
        "latitude": 51.11,
        "longitude": 17.0496,
        "source": "",
    }
    assert rows[1]["latitude"] is None
    # the one with no coordinates placed by Nominatim, once: the second run asks nothing
    assert transparency.geocode(limit=10) == {"asked": 1, "placed": 1, "without": 0}
    assert transparency.geocode(limit=10) == {"asked": 0, "placed": 0, "without": 0}
    rows = [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines()]
    assert (rows[1]["latitude"], rows[1]["longitude"], rows[1]["osm"]) == (51.25, 22.56, "way/7")
    assert asked.count("/osm/search") == 1


def test_the_address_space_of_the_state(stand_in):
    assert transparency.networks(stand_in, wait=0) == {
        "organisations": 2,
        "networks": 1,
        "systems": 1,
    }
    path = Path(transparency.resources()) / "dataset/transparency/networks.jsonl"
    rows = [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines()]
    assert rows == [
        {
            "organisation": "ORG-MI1-RIPE",
            "name": "MINISTERSTWO INFRASTRUKTURY",
            "type": "inetnum",
            "resource": "193.23.63.0 - 193.23.63.255",
            "netname": "MINISTERSTWO-INFRASTRUKTURY",
        },
        {
            "organisation": "ORG-MI1-RIPE",
            "name": "MINISTERSTWO INFRASTRUKTURY",
            "type": "aut-num",
            "resource": "AS211375",
            "netname": "AS_MI_RIPE",
        },
    ]
    # the organisation outside Poland is left out, and no person's e-mail is kept
    assert "a.person" not in path.read_text(encoding="utf-8")

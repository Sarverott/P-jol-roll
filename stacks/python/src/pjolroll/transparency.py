"""The declaration of transparency (phase 44, Q24): every public office with its official
contacts, as the office itself publishes them on dane.gov.pl, placed on OpenStreetMap.

    offices    the resources of resources/configs/transparency/sources.yaml read - CSV or XLSX,
               each with columns of its own - into one table:
               dataset/transparency/offices.jsonl  name, kind, address, phones, e-mails, www,
                                                   ePUAP, latitude, longitude, where it came from
    networks   the address space of the state: organisations of the RIPE database in Poland with
               an e-mail in gov.pl or a public word in their name, and every network and
               autonomous system registered to them - dataset/transparency/networks.jsonl
    geocode    the offices with no coordinates placed by Nominatim (OpenStreetMap), one request
               a second as its policy asks, every answer cached in
               dataset/transparency/geocode.json; © OpenStreetMap contributors (ODbL)

Institutions only: what an office publishes as its own contact. No named person's private data.
"""

from __future__ import annotations

import io
import json
import os
import re
import time
from pathlib import Path
from typing import Any

import httpx2
import pandas
import yaml

from pjolroll.law import ROOT

AGENT = "P-jol-roll (+https://github.com/Sarverott/P-jol-roll)"
API = os.environ.get("DANE_API", "https://api.dane.gov.pl/1.4")
NOMINATIM = os.environ.get("NOMINATIM", "https://nominatim.openstreetmap.org")
RIPE_SEARCH = os.environ.get(
    "RIPE_SEARCH", "https://apps.db.ripe.net/db-web-ui/api/rest/fulltextsearch/select"
)
RIPE_REST = os.environ.get("RIPE_REST", "https://rest.db.ripe.net")

# a column's meaning told by the words of its name (lower case, without Polish marks)
FIELDS = [
    ("latitude", ["szerokosc", "latitude", "lat"]),
    ("longitude", ["dlugosc", "longitude", "lon"]),
    ("emails", ["e-mail", "email", "mail"]),
    ("epuap", ["epuap", "skrytka", "esp"]),
    ("phones", ["telefon", "tel."]),
    ("fax", ["fax", "faks"]),
    ("www", ["www", "strona", "url"]),
    ("postal", ["kod"]),
    ("street", ["ulica", "ul."]),
    ("number", ["nr domu", "numer domu", "nr budynku", "numer"]),
    ("city", ["miejscowosc", "miasto", "poczta"]),
    ("district", ["powiat"]),
    ("voivodeship", ["wojewodztwo"]),
    ("country", ["kraj", "panstwo"]),
    ("name", ["nazwa", "jednostka", "urzad", "placowka", "name"]),
]
PLAIN = str.maketrans("ąćęłńóśźżĄĆĘŁŃÓŚŹŻ", "acelnoszzACELNOSZZ")
EMAIL = re.compile(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+")


def resources() -> Path:
    return Path(os.environ.get("RESOURCES_DIR") or ROOT / "resources")


def field_of(column: str) -> str | None:
    words = " ".join(str(column).lower().translate(PLAIN).split())
    for field, signs in FIELDS:
        if any(sign in words for sign in signs):
            return field
    return None


def table_of(content: bytes, kind: str) -> pandas.DataFrame:
    """A CSV (; or , and cp1250 or UTF-8) or an XLSX as a table of strings."""
    if content[:2] == b"PK":
        return pandas.read_excel(io.BytesIO(content), dtype=str)
    for encoding in ("utf-8-sig", "cp1250"):
        try:
            text = content.decode(encoding)
            break
        except UnicodeDecodeError:
            continue
    separator = (
        ";" if text.split("\n", 1)[0].count(";") >= text.split("\n", 1)[0].count(",") else ","
    )
    return pandas.read_csv(io.StringIO(text), sep=separator, dtype=str)


def number_of(value: str) -> float | None:
    try:
        return float(str(value).replace(",", ".").strip())
    except ValueError:
        return None


def offices_of(table: pandas.DataFrame, kind: str, source: str) -> list[dict[str, Any]]:
    fields: dict[str, list[str]] = {}
    for column in table.columns:
        field = field_of(column)
        if field:
            fields.setdefault(field, []).append(column)
    found = []
    for _, row in table.iterrows():
        values = {
            field: [str(row[c]).strip() for c in columns if str(row[c]).strip() not in ("", "nan")]
            for field, columns in fields.items()
        }
        name = " ".join(values.get("name", [])[:1])
        if not name:
            continue

        def joined(field: str, values: dict[str, list[str]] = values) -> str:
            # two columns may say the same (the town and its post office)
            return " ".join(dict.fromkeys(values.get(field, [])))

        found.append(
            {
                "name": name,
                "kind": kind,
                "voivodeship": joined("voivodeship"),
                "district": joined("district"),
                "city": joined("city"),
                "street": joined("street"),
                "number": joined("number"),
                "postal": (re.search(r"\d{2}-\d{3}", joined("postal")) or [""])[0],
                "country": joined("country"),
                "phones": values.get("phones", []),
                "fax": values.get("fax", []),
                "emails": sorted({m for v in values.get("emails", []) for m in EMAIL.findall(v)}),
                "www": joined("www"),
                "epuap": joined("epuap"),
                "latitude": number_of(joined("latitude")) if values.get("latitude") else None,
                "longitude": number_of(joined("longitude")) if values.get("longitude") else None,
                "source": source,
            }
        )
    return found


def download(resource: int, client: httpx2.Client) -> tuple[bytes, str]:
    said = client.get(f"{API}/resources/{resource}").json()["data"]["attributes"]
    url = said.get("download_url") or said.get("link")
    time.sleep(1)
    return client.get(url, follow_redirects=True).content, url


def offices(sources_file: Path | None = None) -> dict[str, int]:
    sources_file = sources_file or ROOT / "resources/configs/transparency/sources.yaml"
    sources = yaml.safe_load(sources_file.read_text(encoding="utf-8"))["sources"]
    everything: list[dict[str, Any]] = []
    counts: dict[str, int] = {}
    with httpx2.Client(headers={"user-agent": AGENT}, timeout=120) as client:
        for source in sources:
            content, url = download(int(source["resource"]), client)
            found = offices_of(table_of(content, source["kind"]), source["kind"], url)
            counts[source["kind"]] = len(found)
            everything.extend(found)
            time.sleep(1)
    target = resources() / "dataset" / "transparency" / "offices.jsonl"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(
        "".join(json.dumps(one, ensure_ascii=False) + "\n" for one in everything), encoding="utf-8"
    )
    return counts


def geocode(limit: int = 100, wait: float = 1.0) -> dict[str, int]:
    """Offices with no coordinates placed by Nominatim, cached; one request a second."""
    folder = resources() / "dataset" / "transparency"
    path = folder / "offices.jsonl"
    rows = [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line]
    cache_path = folder / "geocode.json"
    cache = json.loads(cache_path.read_text(encoding="utf-8")) if cache_path.exists() else {}
    asked = placed = 0
    with httpx2.Client(headers={"user-agent": AGENT}, timeout=60) as client:
        for row in rows:
            if row.get("latitude") is not None:
                continue
            postal = (re.search(r"\d{2}-\d{3}", row["postal"]) or [""])[0]
            street = re.sub(r"^(ul\.|al\.|pl\.|os\.)\s*", "", row["street"], flags=re.IGNORECASE)
            street = f"{street} {row['number']}".strip()
            country = row.get("country") or "Polska"
            address = " | ".join((street, postal, row["city"], country))
            if address not in cache:
                if asked >= limit:
                    continue
                # structured first (street, town, postal code), then the words of it
                found = []
                for params in (
                    {
                        "street": street,
                        "city": row["city"],
                        "postalcode": postal,
                        "country": country,
                    },
                    {"q": ", ".join(part for part in (street, row["city"], country) if part)},
                ):
                    time.sleep(wait)
                    found = client.get(
                        f"{NOMINATIM}/search",
                        params={
                            **{k: v for k, v in params.items() if v},
                            "format": "jsonv2",
                            "limit": 1,
                        },
                    ).json()
                    if found:
                        break
                cache[address] = (
                    [
                        float(found[0]["lat"]),
                        float(found[0]["lon"]),
                        found[0].get("osm_type", ""),
                        found[0].get("osm_id", ""),
                    ]
                    if found
                    else None
                )
                asked += 1
            if cache[address]:
                row["latitude"], row["longitude"], kind, osm = cache[address]
                row["osm"] = f"{kind}/{osm}" if kind else ""
                placed += 1
    cache_path.write_text(json.dumps(cache, ensure_ascii=False, indent=1), encoding="utf-8")
    path.write_text(
        "".join(json.dumps(r, ensure_ascii=False) + "\n" for r in rows), encoding="utf-8"
    )
    return {
        "asked": asked,
        "placed": placed,
        "without": sum(1 for r in rows if r.get("latitude") is None),
    }


def ripe_organisations(client: httpx2.Client, query: str, wait: float) -> dict[str, str]:
    """Organisations a full-text query finds: key -> name (nothing else of the object)."""
    found: dict[str, str] = {}
    for start in range(0, 2000, 100):
        time.sleep(wait)
        said = client.get(
            RIPE_SEARCH,
            params={"q": query, "rows": 100, "start": start},
            headers={"accept": "application/json"},
        ).json()["result"]
        for doc in said.get("docs", []):  # none when nothing is found
            values = {item["str"]["name"]: item["str"]["value"] for item in doc["doc"]["strs"]}
            if values.get("organisation") and values.get("country", "PL") == "PL":
                found[values["organisation"]] = values.get("org-name", "")
        if start + 100 >= said.get("numFound", 0):
            break
    return found


def networks(sources_file: Path | None = None, wait: float = 1.0) -> dict[str, int]:
    sources_file = sources_file or ROOT / "resources/configs/transparency/sources.yaml"
    ripe = yaml.safe_load(sources_file.read_text(encoding="utf-8"))["ripe"]
    queries = [
        f"(e-mail:({d})) AND (object-type:organisation) AND (country:PL)" for d in ripe["domains"]
    ]
    queries += [
        f'(org-name:("{w}")) AND (object-type:organisation) AND (country:PL)' for w in ripe["words"]
    ]
    organisations: dict[str, str] = {}
    rows: list[dict[str, Any]] = []
    with httpx2.Client(headers={"user-agent": AGENT}, timeout=60) as client:
        for query in queries:
            organisations |= ripe_organisations(client, query, wait)
        for key, name in sorted(organisations.items()):
            if not re.fullmatch(r"ORG-[A-Z0-9-]+", key):
                continue
            time.sleep(wait)
            answer = client.get(
                f"{RIPE_REST}/search.json",
                params=[
                    ("query-string", key),
                    ("inverse-attribute", "org"),
                    ("type-filter", "inetnum"),
                    ("type-filter", "inet6num"),
                    ("type-filter", "aut-num"),
                    ("flags", "no-referenced"),
                    ("flags", "no-irt"),
                ],
                headers={"accept": "application/json"},
            )
            if answer.status_code == 404:  # an organisation with nothing registered to it
                continue
            for item in answer.json().get("objects", {}).get("object", []):
                values = {a["name"]: a["value"] for a in item["attributes"]["attribute"]}
                rows.append(
                    {
                        "organisation": key,
                        "name": name,
                        "type": item["type"],
                        "resource": values.get(item["type"], ""),
                        "netname": values.get("netname") or values.get("as-name", ""),
                    }
                )
    target = resources() / "dataset" / "transparency" / "networks.jsonl"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(
        "".join(json.dumps(r, ensure_ascii=False) + "\n" for r in rows), encoding="utf-8"
    )
    return {
        "organisations": len(organisations),
        "networks": sum(1 for r in rows if r["type"] != "aut-num"),
        "systems": sum(1 for r in rows if r["type"] == "aut-num"),
    }

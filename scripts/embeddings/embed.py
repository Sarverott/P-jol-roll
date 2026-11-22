# /// script
# requires-python = ">=3.12"
# dependencies = ["pyarrow>=20", "requests>=2.32"]
# ///
"""Vectors of the texts of acts by a small local multilingual model (phase 17, Q15).

Every act with markdown in dataset/texts/ gets one vector: its title and the beginning of its
text (TEXT_LENGTH characters) given to the model of Ollama (OLLAMA_URL, the service
llms-ollama or `ollama serve`; EMBED_MODEL, bge-m3 by default - multilingual, Polish among
its languages). They are written beside the texts as
dataset/embeddings/<model>/<journal>/<year>.parquet (ELI, sha256_md, vector), with model.json
saying how they were made. An act whose markdown did not change keeps its vector, so a run is
repeated to take what is new. Run: task embed [-- 2026 1953 ...]
"""

import json
import os
import sys
from pathlib import Path

import pyarrow as pa
import pyarrow.parquet as pq
import requests

ROOT = Path(__file__).resolve().parents[2]
DATASET = Path(os.environ.get("RESOURCES_DIR", ROOT / "resources")) / "dataset"
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434").rstrip("/")
MODEL = os.environ.get("EMBED_MODEL", "bge-m3")
TEXT_LENGTH = 2000
BATCH = 32


def jsonl(path: Path) -> list[dict]:
    if not path.exists():
        return []
    return [json.loads(line) for line in path.read_text().splitlines() if line.strip()]


def embedded(inputs: list[str]) -> list[list[float]]:
    answer = requests.post(
        f"{OLLAMA_URL}/api/embed",
        json={"model": MODEL, "input": inputs, "truncate": True},
        timeout=600,
    )
    answer.raise_for_status()
    return answer.json()["embeddings"]


def main(years: list[int]) -> None:
    folder = DATASET / "embeddings" / MODEL.replace(":", "-").replace("/", "-")
    total = {"embedded": 0, "kept": 0}
    dimensions = 0
    for listing in sorted((DATASET / "acts").glob("*/*.jsonl")):
        journal, year = listing.parent.name, int(listing.stem)
        if years and year not in years:
            continue
        titles = {act["ELI"]: act.get("title", "") for act in jsonl(listing)}
        texts = jsonl(DATASET / "texts" / journal / f"{year}.jsonl")
        if not texts:
            continue
        target = folder / journal / f"{year}.parquet"
        known = {}
        if target.exists():
            table = pq.read_table(target).to_pylist()
            known = {row["ELI"]: row for row in table}
        rows, waiting = [], []
        for record in texts:
            row = known.get(record["ELI"])
            if row and row["sha256_md"] == record["sha256_md"]:
                rows.append(row)
                total["kept"] += 1
            else:
                waiting.append(record)
        for start in range(0, len(waiting), BATCH):
            part = waiting[start : start + BATCH]
            inputs = []
            for record in part:
                markdown = (DATASET / record["markdown"]).read_text(errors="replace")
                inputs.append(f"{titles.get(record['ELI'], '')}\n\n{markdown[:TEXT_LENGTH]}")
            for record, vector in zip(part, embedded(inputs)):
                rows.append({"ELI": record["ELI"], "sha256_md": record["sha256_md"], "vector": vector})
                total["embedded"] += 1
        if not rows:
            continue
        dimensions = len(rows[0]["vector"])
        order = {record["ELI"]: at for at, record in enumerate(texts)}
        rows.sort(key=lambda row: order.get(row["ELI"], len(order)))
        schema = pa.schema([
            ("ELI", pa.string()),
            ("sha256_md", pa.string()),
            ("vector", pa.list_(pa.float32(), dimensions)),
        ])
        target.parent.mkdir(parents=True, exist_ok=True)
        part_file = target.with_suffix(".parquet.part")
        pq.write_table(pa.Table.from_pylist(rows, schema=schema), part_file, compression="snappy")
        part_file.replace(target)
        print(f"{journal}/{year}: {len(rows)} vectors ({len(waiting)} new)", flush=True)
    if dimensions:
        (folder / "model.json").write_text(json.dumps({
            "model": MODEL,
            "by": "Ollama /api/embed",
            "dimensions": dimensions,
            "input": f"title, an empty line, the first {TEXT_LENGTH} characters of the markdown",
            "normalized": True,
        }, indent=2) + "\n")
    print(f"embeddings: {total['embedded']} made, {total['kept']} kept - {folder.relative_to(ROOT) if folder.is_relative_to(ROOT) else folder}", flush=True)


if __name__ == "__main__":
    main([int(year) for year in sys.argv[1:] if year.isdigit()])

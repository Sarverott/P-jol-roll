"""MkDocs hook of P_JOL_ROLL.

1. The marker <!-- state --> on a page becomes the state of the project, counted
   at build time from devlog/TODO.md (phases) and guides/features.md (functions),
   so the website never says more than those two files.
2. A relative link that leaves docs/ (../src/README.md, ../../.github/...) points
   at the file on GitHub, because the website holds only docs/.
3. The devlog and the almanac are not published here (phase 28): a link to a page of
   theirs points at its copy in the wiki (scripts/devops/docs/wiki.py names the pages the
   same way), and a link to another file of theirs at the file on GitHub.
"""

import posixpath
import re
from pathlib import Path

REPO = "https://github.com/Sarverott/P-jol-roll/blob/development/"
WIKI = "https://github.com/Sarverott/P-jol-roll/wiki/"
IN_WIKI = ("docs/devlog/", "docs/almanac/")
NOT_IN_WIKI = ("docs/devlog/AGENTS.md", "docs/devlog/STATE.md")
MARK = "<!-- state -->"

PHASE = re.compile(r"^## Phase (\d+): (.+)$")
ITEM = re.compile(r"^- \[([ x])\] ")
MARKS = ("works", "built", "wanted")
LINK = re.compile(r"\]\((?!https?:|#|mailto:)([^)\s]+)\)")


def phases(docs: Path):
    found = []
    for line in (docs / "devlog" / "TODO.md").read_text(encoding="utf-8").splitlines():
        head = PHASE.match(line)
        if head:
            found.append({"n": head[1], "title": head[2], "done": 0, "all": 0})
            continue
        item = ITEM.match(line)
        if item and found:
            found[-1]["all"] += 1
            found[-1]["done"] += item[1] == "x"
    return found


def features(docs: Path):
    counts = {"works": 0, "built": 0, "wanted": 0}
    for line in (docs / "guides" / "features.md").read_text(encoding="utf-8").splitlines():
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if len(cells) == 3:
            for mark in MARKS:
                if cells[2].startswith(f"**{mark}**"):
                    counts[mark] += 1
    return counts


def state(docs: Path) -> str:
    rows = []
    for phase in phases(docs):
        if phase["all"] and phase["done"] == phase["all"]:
            word = "complete"
        elif phase["done"]:
            word = "in progress"
        else:
            word = "not started"
        rows.append(f"| {phase['n']}: {phase['title']} | {phase['done']}/{phase['all']} | {word} |")
    count = features(docs)
    return "\n".join(
        [
            f"Functions: **{count['works']} work**, {count['built']} built and not yet"
            f" proven on real data, {count['wanted']} wanted -"
            " [the whole list](guides/features.md).",
            "",
            "| Phase of the plan | Steps done | |",
            "| --- | --- | --- |",
            *rows,
            "",
            "Every step is one commit; the plan is [TODO.md](devlog/TODO.md),"
            " the open questions are in [BRAINSTORM.md](devlog/BRAINSTORM.md).",
        ]
    )


def wiki_page(path: str) -> str:
    """docs/devlog/VISION.md -> Devlog-VISION, docs/almanac/README.md -> Almanac (as wiki.py)"""
    parts = path.removeprefix("docs/").removesuffix(".md").split("/")
    if parts[-1] == "README":
        parts = parts[:-1]
    return "-".join([parts[0].capitalize(), *parts[1:]])


def on_page_markdown(markdown, page, config, files):
    docs = Path(config["docs_dir"])
    if MARK in markdown:
        markdown = markdown.replace(MARK, state(docs))

    here = posixpath.dirname(page.file.src_uri)

    def out_of_docs(match):
        target = match[1]
        path, _, anchor = target.partition("#")
        resolved = posixpath.normpath(posixpath.join("docs", here, path))
        if resolved.startswith(IN_WIKI):
            if resolved.endswith(".md") and resolved not in NOT_IN_WIKI:
                return f"]({WIKI}{wiki_page(resolved)}{'#' + anchor if anchor else ''})"
            return f"]({REPO}{resolved}{'#' + anchor if anchor else ''})"
        if resolved.startswith("docs/"):
            return match[0]
        return f"]({REPO}{resolved}{'#' + anchor if anchor else ''})"

    return LINK.sub(out_of_docs, markdown)

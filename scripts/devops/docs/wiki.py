"""The devlog and the almanac copied into the wiki of GitHub (phase 28, the owner's order).

The files stay in docs/ - this is a copy, never the place they are written. Each page of
the wiki is named from its path (the same names the website's hook links to,
docs/_mkdocs/project.py):

    docs/devlog/README.md                    Devlog
    docs/devlog/VISION.md                    Devlog-VISION
    docs/almanac/README.md                   Almanac
    docs/almanac/cataclistics/damaged-pdf.md Almanac-cataclistics-damaged-pdf

A link between copied pages becomes a link of the wiki; any other relative link points
at the file on GitHub. Pages copied before and gone now are deleted; _Sidebar.md lists
every page; Home.md keeps what people wrote and gets the list between two markers.

Usage: python3 wiki.py <the wiki's checkout> <the commit copied>
"""

import posixpath
import re
import sys
from pathlib import Path

REPO = "https://github.com/Sarverott/P-jol-roll/blob/development/"
SKIPPED = {"docs/devlog/AGENTS.md", "docs/devlog/STATE.md"}
LINK = re.compile(r"(\]\()(?!https?:|#|mailto:)([^)\s]+)(\))")
BEGIN, END = "<!-- copied: begin -->", "<!-- copied: end -->"


def page_of(path: str) -> str:
    """docs/<part>/<more>/<name>.md -> Part-more-name (README names its directory)."""
    parts = path.removeprefix("docs/").removesuffix(".md").split("/")
    if parts[-1] == "README":
        parts = parts[:-1]
    return "-".join([parts[0].capitalize(), *parts[1:]])


def sources(root: Path) -> list[str]:
    found = sorted(
        str(path.relative_to(root))
        for part in ("devlog", "almanac")
        for path in (root / "docs" / part).rglob("*.md")
    )
    return [path for path in found if path not in SKIPPED]


def copied(root: Path, path: str, pages: dict[str, str], commit: str) -> str:
    here = posixpath.dirname(path)

    def relink(match: re.Match) -> str:
        target, _, anchor = match[2].partition("#")
        resolved = posixpath.normpath(posixpath.join(here, target)) if target else path
        tail = f"#{anchor}" if anchor else ""
        if resolved in pages:
            return f"{match[1]}{pages[resolved]}{tail}{match[3]}"
        return f"{match[1]}{REPO}{resolved}{tail}{match[3]}"

    text = (root / path).read_text(encoding="utf-8")
    note = (
        f"> A copy of [{path}]({REPO}{path}) at commit `{commit[:7]}`, made by"
        " `task docs:wiki`. It is written there; a change here is lost with the next copy.\n\n"
    )
    return note + LINK.sub(relink, text)


def title(root: Path, path: str) -> str:
    """the first heading of a page, without the "# " (its name when it has none)"""
    for line in (root / path).read_text(encoding="utf-8").splitlines():
        if line.startswith("# "):
            return line[2:].strip()
    return page_of(path)


def sidebar(root: Path, pages: dict[str, str]) -> str:
    def listed(prefix: str) -> list[str]:
        return [
            f"- [{title(root, path)}]({page})"
            for path, page in sorted(pages.items(), key=lambda one: one[1])
            if page.startswith(prefix)
        ]

    lines = ["**[Home](Home)**", "", "**[Devlog](Devlog)**", ""]
    lines += [line for line in listed("Devlog-")]
    lines += ["", "**[Almanac](Almanac)**", ""]
    lines += [line for line in listed("Almanac-") if "-cataclistics-" not in line]
    lines += ["", "**Cases**", ""]
    lines += listed("Almanac-cataclistics-")
    return "\n".join(lines) + "\n"


def home(old: str) -> str:
    block = "\n".join(
        [
            BEGIN,
            "",
            "## The devlog and the almanac",
            "",
            "Copied here from `docs/` of the repository by `task docs:wiki`; written there.",
            "",
            "- [Devlog](Devlog): the plan - [VISION](Devlog-VISION), [ROADMAP](Devlog-ROADMAP),"
            " [TODO](Devlog-TODO), [BRAINSTORM](Devlog-BRAINSTORM), [PROPOSALS](Devlog-PROPOSALS)",
            "- [Almanac](Almanac): what was learnt the hard way - its cases, topics and the [FAQ](Almanac-faq)",
            "",
            END,
        ]
    )
    if BEGIN in old and END in old:
        start, end = old.index(BEGIN), old.index(END) + len(END)
        return old[:start] + block + old[end:]
    return old.rstrip("\n") + "\n\n" + block + "\n"


def main() -> None:
    wiki, commit = Path(sys.argv[1]), sys.argv[2]
    root = Path(__file__).resolve().parents[3]
    pages = {path: page_of(path) for path in sources(root)}
    written = set()
    for path, page in pages.items():
        (wiki / f"{page}.md").write_text(copied(root, path, pages, commit), encoding="utf-8")
        written.add(f"{page}.md")
    for old in wiki.glob("*.md"):
        made_here = old.name in ("Devlog.md", "Almanac.md") or old.name.startswith(("Devlog-", "Almanac-"))
        if made_here and old.name not in written:
            old.unlink()
    (wiki / "_Sidebar.md").write_text(sidebar(root, pages), encoding="utf-8")
    front = wiki / "Home.md"
    front.write_text(home(front.read_text(encoding="utf-8") if front.exists() else ""), encoding="utf-8")
    print(f"{len(pages)} pages copied into {wiki}")


if __name__ == "__main__":
    main()

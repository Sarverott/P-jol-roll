"""The devlog brought into GitHub's own places (phase 28, the owner's order): the markdown of
docs/devlog stays the source, and this writes it there again whenever it changed.

  milestones   one per milestone of ROADMAP.md (M0-M5), closed when every phase of it is done
  issues       one per phase (TODO.md, and the phases ahead of VISION.md), its items as a task
               list, closed when every item is ticked; one per Q<n> and PP<n> - the question or
               the proposal as it stood, the owner's answer word for word from the changelog -
               closed once answered or decided. Each carries a marker <!-- devlog:<key> -->, so
               a run finds its own issues again and only changes what differs.
  the board    a project of the owner (kanban) holding every one of them: Done when closed, In
               Progress when a phase has ticked items, Todo else. Projects need the gh scope
               "project" (gh auth refresh -s project); without it the board is skipped and said so.

Usage: python3 devlog.py [--dry] [--no-board]   (task github:devlog; needs gh logged in)
  --no-board   the issues and milestones only: the workflow's token cannot reach a project of
               a user (devlog.yml), and may still list them
"""

import json
import re
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
DEVLOG = ROOT / "docs" / "devlog"
CHANGELOG = ROOT / "docs" / "changelog"
BLOB = "https://github.com/Sarverott/P-jol-roll/blob/development/"
WIKI = "https://github.com/Sarverott/P-jol-roll/wiki/"
BOARD = "P_JOL_ROLL devlog"
DRY = "--dry" in sys.argv
NO_BOARD = "--no-board" in sys.argv
LABELS = {
    "devlog": ("5319e7", "brought from docs/devlog by task github:devlog"),
    "phase": ("0e8a16", "a phase of TODO.md"),
    "question": ("d876e3", "a question for the owner, Q<n> of BRAINSTORM.md"),
    "proposal": ("fbca04", "an idea in debate, PP<n> of PROPOSALS.md"),
}


def gh(*args: str, data: dict | None = None, quiet: bool = False):
    command = ["gh", *args]
    if data is not None:
        command += ["--input", "-"]
    done = subprocess.run(
        command, input=json.dumps(data) if data is not None else None, capture_output=True, text=True
    )
    if done.returncode:
        if quiet:
            return None
        sys.exit(f"gh {' '.join(args[:3])}: {done.stderr.strip()}")
    return json.loads(done.stdout) if done.stdout.strip().startswith(("{", "[")) else done.stdout


# the repository, asked of gh only when GitHub is written (main): the model above and below is
# read by the mirrors' devlog too (scripts/devops/mirrors/devlog.py, phase 46)
REPO = ""
OWNER = ""


# --- what the markdown says ------------------------------------------------------------------


def numbers(text: str) -> list[int]:
    """"0, 1, 2, 3" / "10-33 (18-21: upkeep)" / "-" -> the phases named"""
    found = []
    for part in re.sub(r"\(.*?\)", "", text).split(","):
        span = re.fullmatch(r"\s*(\d+)\s*-\s*(\d+)\s*", part)
        if span:
            found += range(int(span[1]), int(span[2]) + 1)
        elif part.strip().isdigit():
            found.append(int(part))
    return found


def milestones() -> list[dict]:
    rows = []
    for line in (DEVLOG / "ROADMAP.md").read_text().splitlines():
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if len(cells) == 3 and re.match(r"M\d+:", cells[0]):
            title = re.sub(r"\s*\(.*\)$", "", cells[0])
            rows.append({"title": title, "phases": numbers(cells[1]), "about": cells[0], "can": cells[2]})
    return rows


def phases() -> dict[int, dict]:
    found: dict[int, dict] = {}
    current = None
    for line in (DEVLOG / "TODO.md").read_text().splitlines():
        head = re.match(r"^## Phase (\d+): (.+)$", line)
        if head:
            current = found.setdefault(int(head[1]), {"title": head[2], "items": [], "planned": ""})
        elif current is not None and re.match(r"^- \[[ x]\] ", line):
            current["items"].append(line)
    ahead = False
    for line in (DEVLOG / "VISION.md").read_text().splitlines():
        ahead = ahead or line.startswith("### Phases ahead")
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if ahead and len(cells) == 3 and cells[0].isdigit() and int(cells[0]) not in found:
            title = re.split(r"[:;]", cells[2])[0].strip()
            found[int(cells[0])] = {"title": title, "items": [], "planned": cells[2]}
    return found


def sections(text: str, level: str) -> dict[str, str]:
    """the sections of a markdown text by their heading's first word: "Q19" -> its text"""
    found: dict[str, str] = {}
    parts = re.split(rf"^(?={level} )", text, flags=re.M)
    for part in parts:
        head = re.match(rf"{level} ((?:Q|PP)\d+)\b", part)
        if head:
            found.setdefault(head[1], part.strip())
    return found


def as_they_stood(path: str) -> dict[str, str]:
    """every Q<n>/PP<n> as its file last held it, from the history of that file"""
    commits = subprocess.run(
        ["git", "log", "--reverse", "--format=%H", "--", path], cwd=ROOT, capture_output=True, text=True
    ).stdout.split()
    stood: dict[str, str] = {}
    for commit in commits:
        text = subprocess.run(
            ["git", "show", f"{commit}:{path}"], cwd=ROOT, capture_output=True, text=True
        ).stdout
        stood.update(sections(text, "##"))
    return stood


def answers() -> dict[str, tuple[int, str]]:
    """Q<n>/PP<n> -> (the phase whose changelog holds the answer, the answer's section)"""
    found: dict[str, tuple[int, str]] = {}
    for page in sorted(CHANGELOG.glob("phase-*.md"), key=lambda one: int(one.stem.split("-")[1])):
        phase = int(page.stem.split("-")[1])
        for key, text in sections(page.read_text(), "###").items():
            found.setdefault(key, (phase, text))
    return found


# --- what GitHub holds -----------------------------------------------------------------------


def ensure_labels():
    have = {label["name"] for label in gh("label", "list", "--json", "name", "-L", "200")}
    for name, (color, about) in LABELS.items():
        if name not in have and not DRY:
            gh("label", "create", name, "--color", color, "--description", about)


def sync_milestones(wanted: list[dict], done: set[int]) -> dict[str, int]:
    have = {one["title"]: one for one in gh("api", f"repos/{REPO}/milestones?state=all&per_page=100")}
    numbers_of = {}
    for one in wanted:
        closed = not one["phases"] or all(phase in done for phase in one["phases"])
        body = {
            "title": one["title"],
            "state": "closed" if closed else "open",
            "description": f"{one['about']}. After it: {one['can']}"[:1000],
        }
        old = have.get(one["title"])
        if DRY:
            print(f"milestone {one['title']}: {'same' if old else 'new'}, {body['state']}")
            numbers_of[one["title"]] = old["number"] if old else 0
            continue
        if old is None:
            made = gh("api", f"repos/{REPO}/milestones", "--method", "POST", data=body)
            print(f"milestone {one['title']}: made")
        elif any(old.get(key) != value for key, value in body.items()):
            made = gh("api", f"repos/{REPO}/milestones/{old['number']}", "--method", "PATCH", data=body)
            print(f"milestone {one['title']}: changed")
        else:
            made = old
        numbers_of[one["title"]] = made["number"]
    return numbers_of


def existing_issues() -> dict[str, dict]:
    found = {}
    page = 1
    while True:
        batch = gh("api", f"repos/{REPO}/issues?labels=devlog&state=all&per_page=100&page={page}")
        for issue in batch:
            mark = re.search(r"<!-- devlog:([\w-]+) -->", issue.get("body") or "")
            if mark:
                found[mark[1]] = issue
        if len(batch) < 100:
            return found
        page += 1


def sync_issue(have: dict, key: str, wanted: dict) -> dict:
    old = have.get(key)
    body = {
        "title": wanted["title"],
        "body": f"<!-- devlog:{key} -->\n{wanted['body']}"[:65000],
        "labels": wanted["labels"],
        "milestone": wanted["milestone"],
    }
    if DRY:
        print(f"{key}: {'exists' if old else 'new'}, {wanted['state']} - {wanted['title'][:70]}")
        return old or {}
    if old is None:
        made = gh("api", f"repos/{REPO}/issues", "--method", "POST", data=body)
        print(f"{key}: #{made['number']} opened")
        time.sleep(1)  # GitHub's limit of content made per minute
    else:
        made = old
        differs = (
            old["title"] != body["title"]
            or (old.get("body") or "") != body["body"]
            or sorted(label["name"] for label in old["labels"]) != sorted(body["labels"])
            or (old.get("milestone") or {}).get("number") != body["milestone"]
        )
        if differs:
            made = gh("api", f"repos/{REPO}/issues/{old['number']}", "--method", "PATCH", data=body)
            print(f"{key}: #{made['number']} brought up to date")
    if made["state"] != wanted["state"]:
        reason = {"closed": "completed", "open": None}[wanted["state"]]
        change = {"state": wanted["state"], **({"state_reason": reason} if reason else {})}
        made = gh("api", f"repos/{REPO}/issues/{made['number']}", "--method", "PATCH", data=change)
        print(f"{key}: #{made['number']} {wanted['state']}")
    return made


# --- the board (Projects of the owner) -------------------------------------------------------


def sync_board(issues: list[tuple[dict, str]]):
    listed = gh("project", "list", "--owner", OWNER, "--format", "json", quiet=True)
    if listed is None:
        print(
            "the board skipped: gh has no scope for projects - run once: gh auth refresh -s project,"
            " then task github:devlog again"
        )
        return
    if DRY:
        print(f"the board: {len(issues)} cards")
        return
    board = next((one for one in listed["projects"] if one["title"] == BOARD), None)
    if board is None:
        board = gh("project", "create", "--owner", OWNER, "--title", BOARD, "--format", "json")
        gh("project", "link", str(board["number"]), "--owner", OWNER, "--repo", REPO)
        print(f"the board: project #{board['number']} made and linked to {REPO}")
    number = str(board["number"])
    fields = gh("project", "field-list", number, "--owner", OWNER, "--format", "json")["fields"]
    status = next(field for field in fields if field["name"] == "Status")
    option = {one["name"]: one["id"] for one in status["options"]}
    cards = gh("project", "item-list", number, "--owner", OWNER, "--format", "json", "-L", "1000")["items"]
    placed = {card["content"].get("url"): card for card in cards if card.get("content")}
    for issue, column in issues:
        card = placed.get(issue["html_url"])
        if card is None:
            card = gh("project", "item-add", number, "--owner", OWNER, "--url", issue["html_url"], "--format", "json")
        if card.get("status") != column:
            gh(
                "project", "item-edit", "--id", card["id"], "--project-id", board["id"],
                "--field-id", status["id"], "--single-select-option-id", option[column],
            )
    print(f"the board: {len(issues)} cards in {board.get('url', 'project #' + number)}")


# --- all of it -------------------------------------------------------------------------------


def changelog_link(phase: int) -> str:
    page = CHANGELOG / f"phase-{phase}.md"
    return f"[changelog of phase {phase}]({BLOB}docs/changelog/phase-{phase}.md)" if page.exists() else ""


def wanted() -> tuple[list[dict], set[int], list[dict]]:
    """What the devlog wants anywhere it is written: the milestones of ROADMAP, the phases done,
    and the issues - each {key, title, body, labels, milestone (a title or None), state, ticked}."""
    plan = milestones()
    found = phases()
    complete = {n for n, one in found.items() if one["items"] and all("- [x]" in item for item in one["items"])}
    milestone_of = {phase: one["title"] for one in plan for phase in one["phases"]}
    issues: list[dict] = []
    for n, one in sorted(found.items()):
        lines = [f"**Phase {n}** of [TODO]({WIKI}Devlog-TODO) - {changelog_link(n) or 'no changelog yet'}.", ""]
        if one["planned"]:
            lines += [one["planned"], "", "_Planned in phase 28, not started: its items are written when the owner says so._"]
        else:
            lines += one["items"]
        issues.append(
            {"key": f"phase-{n}", "title": f"Phase {n}: {one['title']}", "body": "\n".join(lines),
             "labels": ["devlog", "phase"], "milestone": milestone_of.get(n),
             "state": "closed" if n in complete else "open",
             "ticked": any("- [x]" in item for item in one["items"])}
        )
    answered = answers()
    for kind, path, label, where in (
        ("Q", "docs/devlog/BRAINSTORM.md", "question", "BRAINSTORM"),
        ("PP", "docs/devlog/PROPOSALS.md", "proposal", "PROPOSALS"),
    ):
        stood = as_they_stood(path)
        still_open = sections((ROOT / path).read_text(), "##")
        for key in sorted(stood, key=lambda one: int(one[len(kind):])):
            text = stood[key]
            title = text.splitlines()[0].lstrip("# ").strip()
            phase, answer = answered.get(key, (None, ""))
            is_open = key in still_open
            lines = [f"**{key}** of [{where}]({WIKI}Devlog-{where}) - as it stood there:", "", *text.splitlines()[1:]]
            if answer and not is_open:
                lines += ["", "---", "", f"**The owner's answer**, word for word ({changelog_link(phase)}):", "", answer]
            issues.append(
                {"key": key, "title": title, "body": "\n".join(lines).strip(), "labels": ["devlog", label],
                 "milestone": milestone_of.get(phase) if phase is not None else None,
                 "state": "open" if is_open else "closed", "ticked": False}
            )
    return plan, complete, issues


def main():
    global REPO, OWNER
    REPO = gh("repo", "view", "--json", "nameWithOwner")["nameWithOwner"]
    OWNER = REPO.split("/")[0]
    plan, complete, issues = wanted()
    ensure_labels()
    numbers_of = sync_milestones(plan, complete)
    have = existing_issues() if not DRY else {}
    cards: list[tuple[dict, str]] = []
    for one in issues:
        issue = sync_issue(
            have, one["key"],
            {"title": one["title"], "body": one["body"], "labels": one["labels"],
             "milestone": numbers_of.get(one["milestone"]) if one["milestone"] else None, "state": one["state"]},
        )
        if one["key"].startswith("phase-"):
            column = "Done" if one["state"] == "closed" else "In Progress" if one["ticked"] else "Todo"
        else:
            column = "Todo" if one["state"] == "open" else "Done"
        cards.append((issue, column))

    if NO_BOARD:
        print("the board left out (--no-board): task github:devlog brings it from a terminal")
    else:
        sync_board(cards)


if __name__ == "__main__":
    main()

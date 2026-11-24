"""What happened, said in the discussion of announcements (phase 29, the owner's order in
https://github.com/Sarverott/P-jol-roll/discussions/107): one comment per event, written by
the workflow that saw it.

  steps <before> <after>   steps of TODO.md ticked between two commits of development, the
                           phases they finished and the milestones of ROADMAP those finished
                           (devlog.yml, on each push of the devlog)
  staging <phase> <pr>     a closed phase on its way to master: the version, the pull request
                           and its gate (phase-close.sh)
  release <tag>            a release published: the tag, the image, the space, the documentation
                           and the website, each as its job ended (release.yml, its last job)

The discussion is ANNOUNCE_DISCUSSION (107 by default). --dry prints the comment instead.
Needs gh logged in, with "discussions: write" in a workflow.
Usage: python3 announce.py [--dry] steps|staging|release <arguments>
"""

import json
import os
import re
import subprocess
import sys

DRY = "--dry" in sys.argv
ARGS = [one for one in sys.argv[1:] if one != "--dry"]
DISCUSSION = int(os.environ.get("ANNOUNCE_DISCUSSION", "107"))
REPO = os.environ.get("GITHUB_REPOSITORY", "Sarverott/P-jol-roll")
SERVER = "https://github.com/" + REPO
SPACE = "https://huggingface.co/spaces/Sarverott/docs-of-law-by-gov-in-poland"
DOCS = "https://lex-polonica.readthedocs.io/"
SITE = "https://sarverott.github.io/P-jol-roll/"
STEP = re.compile(r"^- \[([ x])\] (.+)$")


def run(*command: str) -> str:
    done = subprocess.run(command, capture_output=True, text=True)
    if done.returncode:
        sys.exit(f"{' '.join(command[:3])}: {done.stderr.strip()}")
    return done.stdout


def at(commit: str, path: str) -> str:
    """a file as a commit holds it; empty when it does not"""
    done = subprocess.run(["git", "show", f"{commit}:{path}"], capture_output=True, text=True)
    return done.stdout if done.returncode == 0 else ""


def phases(todo: str) -> dict[int, dict]:
    """TODO.md -> {phase: {"title", "steps": {text: ticked}}}"""
    found: dict[int, dict] = {}
    current = None
    for line in todo.splitlines():
        head = re.match(r"^## Phase (\d+): (.+)$", line)
        if head:
            current = found.setdefault(int(head[1]), {"title": head[2], "steps": {}})
        elif current is not None and (step := STEP.match(line)):
            current["steps"][step[2]] = step[1] == "x"
    return found


def done(phase: dict | None) -> bool:
    return bool(phase and phase["steps"] and all(phase["steps"].values()))


def milestones(roadmap: str) -> dict[str, list[int]]:
    """ROADMAP.md -> {"M4: read by a model": [10, 11, ...]} (as devlog.py reads it)"""
    found = {}
    for line in roadmap.splitlines():
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if len(cells) == 3 and re.match(r"M\d+:", cells[0]):
            named = []
            for part in re.sub(r"\(.*?\)", "", cells[1]).split(","):
                span = re.fullmatch(r"\s*(\d+)\s*-\s*(\d+)\s*", part)
                if span:
                    named += range(int(span[1]), int(span[2]) + 1)
                elif part.strip().isdigit():
                    named.append(int(part))
            found[re.sub(r"\s*\(.*\)$", "", cells[0])] = named
    return found


def short(text: str, most: int = 160) -> str:
    return text if len(text) <= most else text[: most - 1].rstrip() + "…"


def steps(before: str, after: str) -> str | None:
    if not re.fullmatch(r"[0-9a-f]{7,40}", before) or set(before) == {"0"}:
        return None  # a new branch or a push without history: nothing to compare with
    todo = "docs/devlog/TODO.md"
    old, new = phases(at(before, todo)), phases(at(after, todo))
    lines = []
    finished = []
    for number in sorted(new):
        phase = new[number]
        ticked = [text for text, yes in phase["steps"].items() if yes and not old.get(number, {}).get("steps", {}).get(text)]
        if not ticked:
            continue
        lines += ["", f"**Phase {number}: {phase['title']}**", ""]
        lines += [f"- [x] {short(text)}" for text in ticked]
        if done(phase) and not done(old.get(number)):
            finished.append(number)
            lines += ["", f"Phase {number} is done: every step ticked ([issue of the phase]({SERVER}/issues?q=%22Phase+{number}%3A%22))."]
    if not lines:
        return None
    reached = [
        name
        for name, named in milestones(at(after, "docs/devlog/ROADMAP.md")).items()
        if named and all(done(new.get(n)) for n in named) and not all(done(old.get(n)) for n in named)
    ]
    for name in reached:
        lines += ["", f"**Milestone {name} reached**: every phase of it is done."]
    head = f"### Steps done on `development` ({before[:7]}..{after[:7]})"
    return "\n".join([head, *lines, "", f"[The commits]({SERVER}/compare/{before[:12]}...{after[:12]})"])


def staging(phase: str, pr: str) -> str:
    version = json.loads(open("package.json", encoding="utf-8").read())["version"]
    return "\n".join(
        [
            f"### Phase {phase} closed: v{version} on its way to `master`",
            "",
            f"The pull request [#{pr}]({SERVER}/pull/{pr}) `development` → `master` is open; its gate"
            " (verify, CodeQL, Snyk, OSSAR) merges it when every check passes, and the release follows.",
            "",
            f"[What happened in phase {phase}]({SERVER}/blob/development/docs/changelog/phase-{phase}.md)",
        ]
    )


def release(tag: str) -> str:
    def job(name: str) -> str:
        result = os.environ.get(f"RESULT_{name.upper()}", "")
        return {"success": "done", "skipped": "skipped", "failure": "**failed**", "cancelled": "cancelled"}.get(
            result, result or "not known"
        )

    return "\n".join(
        [
            f"### Released: {tag}",
            "",
            f"- [the release and its notes]({SERVER}/releases/tag/{tag})",
            f"- the image `ghcr.io/{REPO.lower()}-webapp-server:{tag.lstrip('v')}`: {job('container')}",
            f"- [the demo space]({SPACE}) set to it and built again: {job('space')}",
            f"- [the documentation]({DOCS}): {job('readthedocs')}",
            f"- [the website]({SITE}): {job('pages')}",
            f"- `master` back into `development`: {job('back')}",
            "",
            f"[The run]({SERVER}/actions/runs/{os.environ.get('GITHUB_RUN_ID', '')})"
            if os.environ.get("GITHUB_RUN_ID")
            else "",
        ]
    ).rstrip()


def post(body: str):
    if DRY:
        print(f"--- discussion #{DISCUSSION} would get:\n{body}")
        return
    owner, name = REPO.split("/")
    found = json.loads(
        run(
            "gh", "api", "graphql",
            "-f", "query=query($o:String!,$n:String!,$d:Int!){repository(owner:$o,name:$n){discussion(number:$d){id}}}",
            "-f", f"o={owner}", "-f", f"n={name}", "-F", f"d={DISCUSSION}",
        )
    )
    discussion = found["data"]["repository"]["discussion"]["id"]
    made = json.loads(
        run(
            "gh", "api", "graphql",
            "-f", "query=mutation($id:ID!,$b:String!){addDiscussionComment(input:{discussionId:$id,body:$b}){comment{url}}}",
            "-f", f"id={discussion}", "-f", f"b={body}",
        )
    )
    print(made["data"]["addDiscussionComment"]["comment"]["url"])


def main():
    if not ARGS:
        sys.exit(__doc__)
    kind, rest = ARGS[0], ARGS[1:]
    if kind == "steps" and len(rest) == 2:
        body = steps(*rest)
    elif kind == "staging" and len(rest) == 2:
        body = staging(*rest)
    elif kind == "release" and len(rest) == 1:
        body = release(*rest)
    else:
        sys.exit(__doc__)
    if body:
        post(body)
    else:
        print("nothing to announce")


if __name__ == "__main__":
    main()

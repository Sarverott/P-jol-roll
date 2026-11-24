"""The devlog on the mirrors (phase 46, the owner's order: "each platform carries same rules for
milestones creation, PR and devlog relation"): what scripts/devops/github/devlog.py writes on
GitHub - a milestone per milestone of ROADMAP, closed when its phases are done; an issue per
phase, Q<n> and PP<n>, with its marker <!-- devlog:<key> -->, labelled, in its milestone, closed
when done or answered - written the same on each mirror of .github/bos.json whose `devlog` names
an API it speaks:
  gitea    gitea.com and a Gitea of our own (its API is GitHub's shape)
  gitlab   gitlab.com
Bitbucket and sourcehut carry the code only: Bitbucket Cloud's issues have no milestones to write,
sourcehut's tracker is a service of its own (todo.sr.ht) - said, not faked.
A mirror's repository is made first when it is not there (--ensure), so the push finds it.

Usage: python3 devlog.py [--ensure] [--dry]   (each mirror's token in the environment variable its
  entry names; a mirror without one is left out and said; MIRROR_OWN_GITEA_URL for our own)
"""

from __future__ import annotations

import importlib.util
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
DRY = "--dry" in sys.argv
ENSURE = "--ensure" in sys.argv
AGENT = "P-jol-roll (+https://github.com/Sarverott/P-jol-roll)"

# the model of the devlog, as GitHub's writer reads it (no gh is asked for it)
spec = importlib.util.spec_from_file_location("devlog", ROOT / "scripts/devops/github/devlog.py")
devlog = importlib.util.module_from_spec(spec)
spec.loader.exec_module(devlog)


def call(method: str, url: str, token: str, auth: str, data=None):
    request = urllib.request.Request(
        url,
        method=method,
        data=json.dumps(data).encode() if data is not None else None,
        headers={
            "user-agent": AGENT,
            "accept": "application/json",
            "content-type": "application/json",
            **({auth: token} if auth == "PRIVATE-TOKEN" else {"authorization": f"token {token}"}),
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=60) as answer:
            body = answer.read()
            return json.loads(body) if body.strip() else None
    except urllib.error.HTTPError as error:
        if error.code == 404:
            return None
        raise SystemExit(f"{method} {url.split('?')[0]}: {error.code} {error.read()[:300]!r}")


# as GitHub's writer has them: closed when every phase is done (or it has none), described alike
def closed_of(milestone: dict, done: set[int]) -> bool:
    return not milestone["phases"] or all(phase in done for phase in milestone["phases"])


def description_of(milestone: dict) -> str:
    return f"{milestone['about']}. After it: {milestone['can']}"[:1000]


class Gitea:
    """gitea.com, or a Gitea of our own: the API of GitHub's shape, labels and milestones by id."""

    def __init__(self, api: str, owner: str, repo: str, token: str):
        self.base, self.repo, self.token = api.rstrip("/"), f"{owner}/{repo}", token
        self.owner, self.name = owner, repo

    def ask(self, method: str, path: str, data=None):
        return call(method, f"{self.base}{path}", self.token, "authorization", data)

    def pages(self, path: str) -> list[dict]:
        found, page = [], 1
        while True:
            batch = self.ask("GET", f"{path}{'&' if '?' in path else '?'}limit=50&page={page}") or []
            found += batch
            if len(batch) < 50:
                return found
            page += 1

    def ensure(self):
        if self.ask("GET", f"/repos/{self.repo}") is None:
            self.ask("POST", "/user/repos", {"name": self.name, "description": "Polish journals of laws - a mirror of github.com/Sarverott/P-jol-roll"})
            print(f"{self.repo}: made")

    def labels(self) -> dict[str, int]:
        have = {one["name"]: one["id"] for one in self.pages(f"/repos/{self.repo}/labels")}
        for name, (color, about) in devlog.LABELS.items():
            if name not in have:
                made = self.ask("POST", f"/repos/{self.repo}/labels", {"name": name, "color": f"#{color}", "description": about})
                have[name] = made["id"]
        return have

    def milestones(self, plan: list[dict], done: set[int]) -> dict[str, int]:
        have = {one["title"]: one for one in self.pages(f"/repos/{self.repo}/milestones?state=all")}
        ids = {}
        for one in plan:
            state = "closed" if closed_of(one, done) else "open"
            body = {"title": one["title"], "description": description_of(one), "state": state}
            old = have.get(one["title"])
            if old is None:
                old = self.ask("POST", f"/repos/{self.repo}/milestones", body)
                print(f"{self.repo}: milestone {one['title']} made")
            if old.get("state") != state or (old.get("description") or "") != body["description"]:
                old = self.ask("PATCH", f"/repos/{self.repo}/milestones/{old['id']}", body)
            ids[one["title"]] = old["id"]
        return ids

    def issues(self, wanted: list[dict], milestones: dict[str, int], labels: dict[str, int]):
        have = {}
        for one in self.pages(f"/repos/{self.repo}/issues?state=all&type=issues&labels=devlog"):
            mark = re.search(r"<!-- devlog:([\w-]+) -->", one.get("body") or "")
            if mark:
                have[mark[1]] = one
        for one in wanted:
            body = {
                "title": one["title"],
                "body": f"<!-- devlog:{one['key']} -->\n{one['body']}",
                "milestone": milestones.get(one["milestone"]) if one["milestone"] else 0,
            }
            old = have.get(one["key"])
            if old is None:
                old = self.ask("POST", f"/repos/{self.repo}/issues", {**body, "labels": [labels[name] for name in one["labels"]]})
                print(f"{self.repo}: {one['key']} #{old['number']} opened")
            elif old["title"] != body["title"] or (old.get("body") or "") != body["body"] or ((old.get("milestone") or {}).get("id") or 0) != body["milestone"]:
                old = self.ask("PATCH", f"/repos/{self.repo}/issues/{old['number']}", body)
                print(f"{self.repo}: {one['key']} #{old['number']} brought up to date")
            if old["state"] != one["state"]:
                self.ask("PATCH", f"/repos/{self.repo}/issues/{old['number']}", {"state": one["state"]})
                print(f"{self.repo}: {one['key']} #{old['number']} {one['state']}")


class GitLab:
    """gitlab.com: a project by its path, labels by name, milestones closed by an event."""

    def __init__(self, api: str, owner: str, repo: str, token: str):
        self.base, self.token, self.owner, self.name = api.rstrip("/"), token, owner, repo
        self.project = urllib.parse.quote(f"{owner}/{repo}", safe="")

    def ask(self, method: str, path: str, data=None):
        return call(method, f"{self.base}{path}", self.token, "PRIVATE-TOKEN", data)

    def pages(self, path: str) -> list[dict]:
        found, page = [], 1
        while True:
            batch = self.ask("GET", f"{path}{'&' if '?' in path else '?'}per_page=100&page={page}") or []
            found += batch
            if len(batch) < 100:
                return found
            page += 1

    def ensure(self):
        if self.ask("GET", f"/projects/{self.project}") is None:
            self.ask("POST", "/projects", {"path": self.name, "name": self.name, "visibility": "public"})
            print(f"{self.owner}/{self.name}: made")

    def labels(self) -> dict[str, str]:
        have = {one["name"] for one in self.pages(f"/projects/{self.project}/labels")}
        for name, (color, about) in devlog.LABELS.items():
            if name not in have:
                self.ask("POST", f"/projects/{self.project}/labels", {"name": name, "color": f"#{color}", "description": about})
        return {name: name for name in devlog.LABELS}

    def milestones(self, plan: list[dict], done: set[int]) -> dict[str, int]:
        have = {one["title"]: one for one in self.pages(f"/projects/{self.project}/milestones")}
        ids = {}
        for one in plan:
            closed = closed_of(one, done)
            old = have.get(one["title"]) or self.ask(
                "POST", f"/projects/{self.project}/milestones", {"title": one["title"], "description": description_of(one)}
            )
            if (old.get("state") == "closed") != closed:
                self.ask("PUT", f"/projects/{self.project}/milestones/{old['id']}", {"state_event": "close" if closed else "activate"})
            ids[one["title"]] = old["id"]
        return ids

    def issues(self, wanted: list[dict], milestones: dict[str, int], labels: dict[str, str]):
        have = {}
        for one in self.pages(f"/projects/{self.project}/issues?labels=devlog&scope=all"):
            mark = re.search(r"<!-- devlog:([\w-]+) -->", one.get("description") or "")
            if mark:
                have[mark[1]] = one
        for one in wanted:
            body = {
                "title": one["title"],
                "description": f"<!-- devlog:{one['key']} -->\n{one['body']}",
                "labels": ",".join(one["labels"]),
                "milestone_id": milestones.get(one["milestone"]) if one["milestone"] else None,
            }
            old = have.get(one["key"]) or self.ask("POST", f"/projects/{self.project}/issues", body)
            state = "closed" if old["state"] == "closed" else "open"
            change = {**body, **({"state_event": "close" if one["state"] == "closed" else "reopen"} if state != one["state"] else {})}
            if old.get("description") != body["description"] or old["title"] != body["title"] or "state_event" in change:
                self.ask("PUT", f"/projects/{self.project}/issues/{old['iid']}", change)


def mirrors() -> list[dict]:
    settings = json.loads((ROOT / ".github/bos.json").read_text())
    own = os.environ.get("MIRROR_OWN_GITEA_URL", "").rstrip("/")
    found = []
    only = [name for name in os.environ.get("MIRRORS_ONLY", "").split(",") if name]
    for one in settings["mirrors"]["to"]:
        if only and one["name"] not in only:
            continue
        if not one.get("devlog"):
            print(f"{one['name']}: the code only - no milestones or issues written there")
            continue
        api = one["api"].replace("$MIRROR_OWN_GITEA_URL", own)
        token = os.environ.get(one["secret"], "")
        if api.startswith("/") or not token:
            print(f"{one['name']}: no {'address' if api.startswith('/') else one['secret']} - left out")
            continue
        owner, repo = one["web"].rstrip("/").split("/")[-2:]
        found.append({**one, "client": (Gitea if one["devlog"] == "gitea" else GitLab)(api, owner, repo, token)})
    return found


def main():
    plan, done, wanted = devlog.wanted()
    for mirror in mirrors():
        client = mirror["client"]
        if DRY:
            print(f"{mirror['name']}: {len(plan)} milestones, {len(wanted)} issues would be written")
            continue
        if ENSURE:
            client.ensure()
            continue
        labels = client.labels()
        ids = client.milestones(plan, done)
        client.issues(wanted, ids, labels)
        print(f"{mirror['name']}: the devlog written ({len(plan)} milestones, {len(wanted)} issues)")


if __name__ == "__main__":
    main()

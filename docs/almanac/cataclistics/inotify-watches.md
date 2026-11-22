---
id: inotify-watches
labels: [bug]
status: solved
issue:
---

# Notices of changed files stop when two api servers run

**Status:** solved · **Topic:** [viewer](../solutions/viewer.md) ·
**Chain:** `api:serve → api:serve-again → watch:silent`

## What happened

The test of socket.io waited for "changed" and timed out; the code had not changed, and the api of the commit before failed the same way. Two api servers were running on the machine, each over the whole local dataset.

## Cause

The api watches `resources/dataset` recursively (`fs.watch`) to tell the viewer what changed, and Linux gives one inotify watch per directory, 65536 for a user (`/proc/sys/fs/inotify/max_user_watches`). The dataset has tens of thousands of directories, so one server takes most of them; a second one, or a test beside them, gets none - and `fs.watch` fails silently, so nothing is ever noticed.

## Solution

One api over the full dataset per machine; servers for checks are stopped when done (by their pid - never `pkill -f` with a pattern, which matched the shell that ran it). A machine that needs more raises `fs.inotify.max_user_watches`.

## Seen

- 2026-11-22: phase 21, the MCP test beside a running api

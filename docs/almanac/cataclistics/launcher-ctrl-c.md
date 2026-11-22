---
id: launcher-ctrl-c
labels: [bug]
status: solved
issue:
---

# Ctrl+C in a task of the launcher does not stop it

**Status:** solved · **Topic:** [terminal](../solutions/terminal.md) ·
**Chain:** `launcher:repl → task:run → terminal:raw → ctrl-c:byte`

## What happened

Ctrl+C reached the task as a byte instead of a signal.

## Cause

Under `task`, the REPL's readline keeps the terminal raw, and `script` copies that mode to the task's terminal.

## Solution

The terminal is cooked before a task, raw again after.

## Seen

- 2026-11-22: phase 10

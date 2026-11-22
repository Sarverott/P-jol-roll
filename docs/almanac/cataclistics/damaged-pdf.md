---
id: damaged-pdf
labels: [bug]
status: solved
issue:
---

# A damaged PDF stops the whole text run

**Status:** solved · **Topic:** [pdf-texts](../solutions/pdf-texts.md) ·
**Chain:** `text:pdf → pdftotext:syntax-error → text:crashed`

## What happened

The owner's `task text -- --pdf` stopped on DU/1932/38. Later DU/2007/189 showed the same: "Syntax Error: Couldn't find trailer dictionary".

## Cause

The PDF ends in zeros; its checksum matches the record, so it was saved as it came from the source.

## Solution

A damaged PDF stops nothing: what poppler still reads is kept, otherwise the act goes to `texts/<j>/<year>.scans.jsonl` with its `error`. Whether the source serves these files so is in `docs/.agents/things-to-check.md`.

## Seen

- 2026-11-22: DU/1932/38, DU/2007/189
- v0.11.x

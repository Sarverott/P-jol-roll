---
id: hub-binary-text
labels: [bug]
status: solved
issue:
---

# Hugging Face takes a markdown text for a binary file and refuses the commit

**Status:** solved · **Topic:** [hugging-face](../solutions/hugging-face.md) ·
**Chain:** `text:pdf → pdftotext:control-characters → hub:push → hub:binary-refused`

## What happened

`hub push dataset` sent 1000 of 114433 files, then crashed: "Your push was rejected because it contains binary files... Offending files: texts/MP/2025/WMP20250000029.md".

## Cause

Glyphs that a font of a PDF maps to no character come out of pdftotext as control bytes (1-31): MP/2025/29 had 670 of them, 2205 texts had some. Hugging Face takes such a file as binary, and one such file refuses the whole commit of 1000.

## Solution

Texts drop every C0 and C1 control character but tab, new line, carriage return and form feed; a line that held only such characters goes away whole, so it makes no gap that ends a paragraph (`printable()` in `src/core/parsing/pdf.ts`). A text written before is read once on the next `task text`: clean, its record is marked `printable`; holding any, it is made again. `push` holds such texts back and names them before anything is sent (`heldBack()` in `hub.ts`).

## Seen

- 2026-11-22: logs/log-1795338475468-verbose-hub-push.log, request Root=1-6b02b10b-5272227d3731908f64a02d71
- v0.15.2

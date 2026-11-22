---
id: utf16-producer
labels: [bug]
status: solved
issue:
---

# The producer of some PDFs reads as Chinese

**Status:** solved · **Topic:** [pdf-texts](../solutions/pdf-texts.md) ·
**Chain:** `text:pdf → pdfinfo:producer → record:garbled-producer`

## What happened

Records named producers like `䵩捲潳潦璮⁗潲搠㈰ㄹ`.

## Cause

Some PDFs keep the producer as UTF-16 without its byte-order mark, and it is read as one UTF-16 string of the wrong order.

## Solution

`repairedName()` in `pdf.ts` reads such pairs back ("Microsoft® Word 2019"); the last letter of an odd length is lost.

## Seen

- 2026-11-22: phase 12

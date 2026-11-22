---
id: argos-mangles-names
labels: [bug]
status: partly solved: the packs wait for a person to review them
issue:
---

# Machine translation changes names and identifiers

**Status:** partly solved: the packs wait for a person to review them · **Topic:** [translations](../solutions/translations.md) ·
**Chain:** `i18n:translate → argos:transliterates → pack:wrong-names`

## What happened

Ukrainian turned Latin names into Cyrillic; `huggingface`, `Taskfile`, paths and `SHA-256` came out changed; "Bucket" became "Bukiet".

## Cause

argos transliterates letters but never numbers.

## Solution

Names in `keep`, identifiers and `{named}` places stand in as numbers from 701 while the model works; a text that is one identifier gets no hook; a person fixes an entry and lists it in `reviewed`, which is never overwritten.

## Seen

- 2026-11-22: phase 16

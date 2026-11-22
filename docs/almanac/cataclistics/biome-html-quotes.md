---
id: biome-html-quotes
labels: [bug]
status: solved
issue:
---

# Biome's formatter of HTML breaks a Vue attribute with a string inside

**Status:** solved · **Topic:** [dependencies](../solutions/dependencies.md) ·
**Chain:** `biome:html-enabled → hook:format → biome:parse-error`

## What happened

With `html.experimentalFullSupportEnabled`, the pre-commit hook stopped on "Expected an attribute but instead found '.pdf"))"" in a template it had formatted itself.

## Cause

The formatter wraps a long expression of an attribute (`v-for="... .filter((one) => one.endsWith('.pdf'))"`, an array `['type', 'status']`) over lines and then cannot parse its own output when it writes the fix. Plain `biome check` passes; `--write` fails.

## Solution

Expressions with strings in them live in `<script setup>` (a computed, a constant) and the template only names them - easier to read anyway. The Jinja of MkDocs (`docs/_mkdocs/overrides`) is left out of Biome: it is not HTML.

## Seen

- 2026-11-22: phase 21, Biome 2.6.8

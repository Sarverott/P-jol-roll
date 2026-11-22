---
id: i18n-test-dom
labels: [bug]
status: solved
issue:
---

# Translations of what Vue renders later cannot be tested in linkedom

**Status:** solved · **Topic:** [translations](../solutions/translations.md) ·
**Chain:** `test:i18n → linkedom:no-characterdata → observer:silent`

## What happened

The observer never saw Vue writing a text node again.

## Cause

linkedom reports no `characterData` mutations; node has no global MutationObserver.

## Solution

`follow()` takes the Observer as a parameter; that test runs in jsdom, as browsers do.

## Seen

- 2026-11-22: phase 16

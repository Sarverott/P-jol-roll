---
id: sigma-edges
labels: [bug]
status: solved
issue:
---

# The map of the law shows hidden edges in wrong colours

**Status:** solved · **Topic:** [viewer](../solutions/viewer.md) ·
**Chain:** `map:draw → sigma:hidden-ignored → map:wrong`

## What happened

Edges meant to be hidden were drawn; some colours came out wrong.

## Cause

Sigma 4 hides by `visibility: "hidden"`, not `hidden: true`; an 8-digit short hex colour renders wrong.

## Solution

`visibility`, 6-digit colours with alpha apart; a node's position on screen is `graphToViewport(graph.getNodeAttributes(node))`.

## Seen

- 2026-11-22: phase 14

# ADR 0001 — `Track` collapsed to `spine` in v1

- **Status:** Accepted
- **Date:** 2026-06-08

## Context

`CONTEXT.md` defines **Track** as a load-bearing concept: every Master Node
belongs to one of `spine` / `foundations` / `internals` / `classical`, orthogonal
to its Phase, with per-Goal depth targets promoting or demoting the optional
tracks.

The implementation does not match this. The `track` column was removed from the
`master_roadmap_nodes` table. Both read paths build the graph with `track`
defaulting to `"spine"` (`buildMasterRoadmapData`, and the canonical column list
in `src/lib/roadmap/masterRoadmapRepo.ts`). For a period, `fetchMasterRoadmap`
still *selected* `track`; the query errored and the `?? []` fallback silently
returned zero nodes — shipping an empty Master Roadmap to production (the
node-detail panel stopped opening). That select has since been removed.

So the documented four-value Track design is dead code at the data layer: no
column, no per-track behaviour, every node is `spine`.

## Decision

Keep Track collapsed to `spine` for v1. Do **not** restore the `track` column or
the four-value behaviour now. Reconcile the documentation to reality:
`CONTEXT.md` marks Track as collapsed-to-spine with the four-value design noted
as future intent, not current behaviour.

Reasoning:
- No current feature reads a node's track; restoring the column is migration +
  curation work with no consumer.
- The richer design (optional tracks gated by Goal) is worth keeping as recorded
  intent, but encoding it now would be a hypothetical seam — one notional
  variation with no caller exercising it.

## Consequences

- Architecture reviews should not re-suggest "introduce a Track seam" or
  "restore the track column" without a concrete consumer driving it.
- If/when per-track curation returns: re-add the column, add it to the single
  column list in `masterRoadmapRepo.ts`, stop defaulting in
  `buildMasterRoadmapData`, and remove the status note in `CONTEXT.md`.
- Until then, code that needs to distinguish optional from required learning uses
  the **Dependency Edge** types (`required` / `recommended` / `contextual`),
  which are real and populated, not Track.

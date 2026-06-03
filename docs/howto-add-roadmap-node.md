# How to add or edit a Master Roadmap node

You'll have a new node (or edited node) live in the roadmap, with curated resources and a project. Changes go through a SQL migration reviewed before merging.

## Prerequisites

- Local dev environment running (see [howto-local-setup.md](howto-local-setup.md))
- Familiarity with the domain — node titles and blurbs are written for engineers, not beginners
- Understanding of the 7-phase curriculum structure (see [CONTEXT.md](../CONTEXT.md))

## Steps

### 1. Understand the data model

Each Master Roadmap node has:
- A **slug ID** (e.g. `transformer-self-attention`) — permanent, used as FK
- A **phase** (1–7) and **row_index** (order within phase)
- **Difficulty** (1–5) and **hours** at each depth level (awareness / working / fluent / expert)
- **Relevance scores** (0.0–1.0) for five domains: fintech, research, mlops, dev_tools, education_ai
- **skipForLevels** — programming levels at which this node is auto-skipped during personalization
- **Curated resources** — linked via `master_roadmap_resources` (separate table)
- **Curated projects** — linked via `master_roadmap_projects` (separate table)

### 2. Create a new migration file

```bash
# Name the file with the next available number
touch supabase/migrations/007_add_<slug>.sql
```

### 3. Write the migration

#### Insert the node

```sql
INSERT INTO master_roadmap_nodes (
  id, title, blurb, phase, row_index, difficulty,
  hours_awareness, hours_working, hours_fluent, hours_expert,
  relevance_fintech, relevance_research, relevance_mlops, relevance_dev_tools, relevance_education_ai,
  skip_for_levels,
  depth_awareness, depth_working, depth_fluent, depth_expert,
  is_published
) VALUES (
  'quantization-fundamentals',
  'Quantization Fundamentals',
  'Reduce model size and inference cost by representing weights at lower precision.',
  5,         -- phase: LLMs
  4,         -- row_index: position within phase
  3,         -- difficulty 1-5
  4, 12, 24, 48,  -- hours: awareness, working, fluent, expert
  0.4, 0.8, 0.9, 0.7, 0.5,  -- domain relevance scores
  ARRAY['beginner']::text[],  -- skip for beginners
  'Understand what quantization does to a model and why it matters for deployment cost.',
  'Implement INT8 post-training quantization on a small transformer and measure size vs. accuracy tradeoff.',
  'Apply GPTQ or AWQ to a 7B model and write an evaluation report.',
  NULL,  -- expert depth description (optional)
  true   -- is_published: false keeps it hidden until ready
);
```

#### Add dependency edges

```sql
-- This node requires transformer-basics to be at working depth first
INSERT INTO master_roadmap_edges (from_node_id, to_node_id, edge_type)
VALUES ('transformer-basics', 'quantization-fundamentals', 'required');

-- Recommends understanding inference optimization first
INSERT INTO master_roadmap_edges (from_node_id, to_node_id, edge_type)
VALUES ('inference-optimization', 'quantization-fundamentals', 'recommended');
```

**Edge type rules:**
- Use `required` only when the prerequisite is genuinely blocking — the user will be confused without it.
- Use `recommended` for "strongly helps" cases.
- `contextual` is for loose thematic connections.

#### Add curated resources

```sql
INSERT INTO master_roadmap_resources (node_id, title, url, resource_type, depth_level, estimated_minutes, is_free)
VALUES
  ('quantization-fundamentals',
   'A Visual Guide to Quantization',
   'https://newsletter.maartengrootendorst.com/p/a-visual-guide-to-quantization',
   'blog', 'awareness', 20, true),

  ('quantization-fundamentals',
   'bitsandbytes: 8-bit Optimizers and Quantization',
   'https://github.com/TimDettmers/bitsandbytes',
   'docs', 'working', 60, true),

  ('quantization-fundamentals',
   'GPTQ: Accurate Post-Training Quantization',
   'https://arxiv.org/abs/2210.17323',
   'paper', 'fluent', 90, true);
```

Resource selection criteria:
- Prefer free resources. Paid resources are fine for fluent/expert depth where no free equivalent exists.
- `estimated_minutes` should be realistic — include reading time, not just skim time.
- Cover at least awareness and working depth. Expert depth resources are optional.

#### Add a curated project

```sql
INSERT INTO master_roadmap_projects (node_id, title, description, depth_level, deliverable, estimated_hours)
VALUES (
  'quantization-fundamentals',
  'Quantize a Transformer and Benchmark Tradeoffs',
  'Apply INT8 post-training quantization to a small HuggingFace model (e.g. distilbert-base). Measure model size, inference latency, and accuracy delta on a benchmark dataset. Write a brief findings report.',
  'working',
  'A Python script that loads the original and quantized model, runs evaluation, and prints a comparison table. Committed to GitHub.',
  8.0
);
```

Project guidelines:
- The deliverable must be a **runnable artifact** — a script, notebook, or function, not a write-up.
- `estimated_hours` is for `working` depth. Scope it to be completable in an evening or two.
- Title format: `Verb a Noun` — e.g. "Quantize a Transformer", not "Understanding Quantization".

### 4. Apply the migration locally

```bash
supabase db push
```

### 5. Verify in the roadmap

Visit [http://localhost:3000/roadmap](http://localhost:3000/roadmap). The new node should appear in the correct phase position. If it doesn't appear, check that `is_published = true` in your migration.

To verify the resources and project load correctly, complete onboarding so the node appears in a Personalized Roadmap. The plan generator will use your node's resources and project as grounding.

### 6. Run tests

```bash
bun test
```

The master roadmap tests in `src/lib/roadmap/__tests__/masterRoadmap.test.ts` and `masterRoadmapSeed.test.ts` will catch structural issues (missing required fields, broken edge references).

### 7. Commit and open a PR

```bash
git add supabase/migrations/007_add_quantization-fundamentals.sql
git commit -m "feat(roadmap): add quantization-fundamentals node to phase 5"
```

The PR description should include:
- Why this node belongs in the curriculum at this phase/row position
- Which existing nodes it depends on and why
- Resource quality rationale (why these specific resources)
- Any `skipForLevels` logic

## Editing an existing node

To update an existing node's title, blurb, or relevance scores, create a migration with an `UPDATE` statement:

```sql
UPDATE master_roadmap_nodes
SET
  blurb = 'Updated description.',
  relevance_mlops = 0.95
WHERE id = 'existing-node-slug';
```

Do not change a node's `id` — it's used as a foreign key across multiple tables. Changing it requires updating all dependent rows.

## Unpublishing a node

To remove a node from the public roadmap without deleting it (preserving user data):

```sql
UPDATE master_roadmap_nodes
SET is_published = false
WHERE id = 'node-to-hide';
```

Existing `user_node_states` rows referencing this node are preserved. The node disappears from `/roadmap` and from new Personalized Roadmaps but does not affect existing users.

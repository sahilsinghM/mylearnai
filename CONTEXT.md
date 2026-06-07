# DeepPath — Domain Glossary

## Core Concepts

**Master Roadmap**
The human-curated, publicly visible knowledge graph of AI/ML topics. ~33 nodes across 7 phases with explicit dependency edges. Lives in Supabase. Visible at `/roadmap` without login. The source of truth for all personalized roadmaps. AI agents read from it but never write to it without human review.

**Master Node**
One learnable topic in the Master Roadmap. Has four depth levels (awareness / working / fluent / expert), curated resources per depth, at least one project at working depth, and domain relevance scores (fintech, research, mlops, dev_tools, education_ai). Identity is a slug (e.g. `transformer-self-attention`).

**Dependency Edge**
A directed relationship between two Master Nodes. Three types:
- `required` — hard constraint; target node cannot begin until source is at working depth
- `recommended` — source significantly aids understanding of target; included by default
- `contextual` — useful context but not required

**Personalized Roadmap**
A per-user filtered and reordered projection of the Master Roadmap. Created at the end of onboarding. Contains the same Master Nodes (no custom nodes), with per-user depth targets and ordering. Updated by the Adaptation Agent over time.

**Node State**
The state of a Master Node within a specific user's Personalized Roadmap. Values: `locked` / `available` / `in_progress` / `completed` / `skipped` / `deferred`.

**Active Node**
The single Master Node a user is currently working on. Drives weekly plan generation.

**Weekly Plan**
A Claude-generated 7-day task breakdown for the Active Node. Grounded in the Active Node's curated resources and projects from the Master Roadmap. Generated fresh each week (or when the Active Node changes). The existing `LearningPlan → PlanDay → Task` schema.

**Adaptation Agent**
The system that observes behavioral signals and proposes changes to the Personalized Roadmap. In v1, makes two decision types only: INSERT and REMOVE. Runs synchronously in a Next.js Route Handler triggered by quiz submission. All decisions are logged to the Adaptation Log before being applied.

**INSERT Decision**
An Adaptation Agent decision to add a prerequisite review node before the current Active Node. Triggered when a user scores < 65% on the same node's quiz on 2 attempts. Requires explicit user acceptance before being applied.

**REMOVE Decision**
An Adaptation Agent decision to mark a node as skipped because mastery is already demonstrated. Triggered when a user scores > 90% on a quiz and the associated project is submitted. Auto-applied with a dashboard notification.

**Adaptation Log**
An append-only record of all decisions the Adaptation Agent has made for a user. Each entry has: decision type, affected node, human-readable reasoning (Claude-generated), triggering signals, timestamp, and user response (accepted / overridden / auto-applied). Visible to the user. Cannot be deleted.

**Onboarding**
A 3-step flow at signup: (1) Goal selection, (2) Background declaration (structured self-report, no adaptive quiz), (3) Time availability. Output feeds the initial Personalized Roadmap generation. Takes under 5 minutes.

**Goal**
A user's stated learning objective. Options: Build AI-powered products / Transition to AI/ML role / AI for my domain / Research and academia / Build in public. Sets initial depth targets for all nodes in the Personalized Roadmap.

**Depth Target**
The depth level the Adaptation Agent assigns to a specific node for a specific user, based on their Goal and domain. One of: awareness / working / fluent / expert.

**Signal**
An interpreted behavioral event that informs Adaptation Agent decisions. In v1, two signal types matter: `COMPREHENSION_FAILURE` (quiz < 65% on 2 attempts) and `MASTERY_DEMONSTRATED` (quiz > 90% + project submitted).

**Phase**
A major curriculum section grouping Master Nodes. Seven phases in the current graph: Foundations / Classical ML / Deep Learning / Transformers / LLMs / Agents & RAG / Production. Each phase has a distinct hue used in the graph visualization.

**Track**
Which path a Master Node belongs to, orthogonal to its Phase.

> **Status (v1): collapsed to `spine`.** The `track` column was removed from
> `master_roadmap_nodes`; every Master Node is treated as `spine` in code
> (`buildMasterRoadmapData` defaults it). The four-value design below is
> *intended* direction, not current behaviour. See ADR 0001. Do not build
> features that read a node's track until the column and data are restored.

Intended four values:
- `spine` — the required builder path (working with LLMs → RAG → agents → evaluation → customizing → production). Every learner follows it.
- `foundations` — optional math (linear algebra, probability, calculus).
- `internals` — optional "how models work" depth (backprop, attention math, pretraining, RLHF).
- `classical` — optional classical / tabular ML.

The intent: spine nodes connect with `required` edges; optional-track nodes connect with `recommended` / `contextual` edges so they are reachable but never block spine progress. Per-goal depth targets decide which optional tracks a given user actually follows — "Build AI products" keeps them shallow/skippable, "Research" promotes them.

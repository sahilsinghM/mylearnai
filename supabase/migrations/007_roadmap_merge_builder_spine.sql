-- Migration 007 — Merge: builder-first spine + optional depth tracks
--
-- The original 33-node roadmap was researcher-shaped: a learner had to grind
-- through linear algebra, classical ML, and from-scratch deep-learning internals
-- before touching anything they could ship. This migration merges that path with
-- a builder-first spine so the same master roadmap serves both audiences:
--
--   * track = 'spine'        required AI-engineering path (ships AI products)
--   * track = 'foundations'  optional math (linear algebra, probability, calculus)
--   * track = 'internals'    optional "how models work" (backprop, attention math)
--   * track = 'classical'    optional classical / tabular ML
--
-- Spine nodes connect with `required` edges. Optional-track nodes connect with
-- `recommended` / `contextual` edges so they are visible and reachable but never
-- block forward progress on the spine. Per-goal depth targets (set during
-- onboarding) decide which tracks a given user actually follows.

-- 1. Track column ------------------------------------------------------------

ALTER TABLE master_roadmap_nodes
  ADD COLUMN IF NOT EXISTS track TEXT NOT NULL DEFAULT 'spine'
    CHECK (track IN ('spine', 'foundations', 'internals', 'classical'));

-- 2. Reclassify the existing 33 nodes ---------------------------------------

-- Optional math foundations
UPDATE master_roadmap_nodes SET track = 'foundations'
  WHERE id IN ('linear-algebra', 'probability-stats', 'calculus-optimization');

-- Optional classical / tabular ML
UPDATE master_roadmap_nodes SET track = 'classical'
  WHERE id IN ('supervised-learning', 'feature-engineering', 'model-evaluation',
               'xgboost-trees', 'shap-explainability');

-- Optional model internals
UPDATE master_roadmap_nodes SET track = 'internals'
  WHERE id IN ('neural-networks-mlp', 'pytorch-basics', 'autograd-backprop',
               'training-dynamics', 'regularization', 'self-attention',
               'positional-encoding', 'multi-head-attention', 'transformer-block',
               'pretraining-objectives', 'rlhf-alignment');

-- Everything else stays on the spine (python-proficiency, embeddings-tokenization,
-- prompt-engineering, fine-tuning-lora, evaluation-llms, vector-databases,
-- rag-engineering, agent-architectures, tool-use-function-calling,
-- multi-agent-systems, model-serving, observability-monitoring, cost-optimization,
-- safety-guardrails) — the column default of 'spine' already covers them.

-- 3. Unblock the spine -------------------------------------------------------
-- These existing edges run from an optional internals node INTO a spine node as
-- `required`, which would lock the builder path behind the math track. Downgrade
-- them to `contextual` so they inform without blocking.

UPDATE master_roadmap_edges SET edge_type = 'contextual'
  WHERE (from_node_id, to_node_id) IN (
    ('pytorch-basics',    'embeddings-tokenization'),
    ('pytorch-basics',    'fine-tuning-lora'),
    ('transformer-block', 'fine-tuning-lora')
  );

-- 4. New builder spine nodes -------------------------------------------------
-- Placed into existing phase columns (phase is constrained 1..7); the `track`
-- column and per-goal depth targets handle builder ordering and emphasis.

INSERT INTO master_roadmap_nodes
  (id, title, blurb, phase, row_index, difficulty,
   hours_awareness, hours_working, hours_fluent, hours_expert,
   relevance_fintech, relevance_research, relevance_mlops, relevance_dev_tools, relevance_education_ai,
   skip_for_levels, track)
VALUES
  -- Phase 5 — Working with LLMs (spine)
  ('llm-mental-model', 'How LLMs Work (Mental Model)',
   'Tokens, context windows, sampling, temperature. The working model you need to use an LLM well — not how to train one.',
   5, 5, 1, 1, 5, 12, 24, 0.8, 0.6, 0.85, 1.0, 0.9,
   ARRAY[]::TEXT[], 'spine'),

  ('calling-model-apis', 'Calling Model APIs',
   'SDKs, streaming, retries, rate limits, error handling. The plumbing every AI feature sits on.',
   5, 6, 1, 1, 6, 14, 28, 0.85, 0.4, 0.95, 1.0, 0.75,
   ARRAY['senior','staff'], 'spine'),

  ('structured-output', 'Structured Output & Schemas',
   'Force models to return validated JSON. The difference between a demo and something you can build on.',
   5, 7, 2, 1, 6, 16, 30, 0.95, 0.45, 0.9, 1.0, 0.7,
   ARRAY[]::TEXT[], 'spine'),

  ('customization-decision', 'Prompt vs RAG vs Fine-tune',
   'Choosing the cheapest tool that works. Most teams reach for fine-tuning when prompting or RAG would have done.',
   5, 8, 2, 1, 6, 14, 28, 0.9, 0.5, 0.9, 0.95, 0.7,
   ARRAY[]::TEXT[], 'spine'),

  ('dataset-curation', 'Dataset Curation for Fine-tuning',
   'Building, cleaning, and deduping training data. Fine-tuning quality is a data problem, not a model problem.',
   5, 9, 3, 1, 8, 20, 45, 0.85, 0.6, 0.9, 0.8, 0.65,
   ARRAY[]::TEXT[], 'spine'),

  -- Phase 6 — RAG & Agents (spine)
  ('document-chunking', 'Document Chunking & Processing',
   'Splitting, cleaning, and structuring source documents. Retrieval is only as good as what you put in.',
   6, 5, 2, 1, 6, 14, 28, 0.9, 0.4, 0.9, 0.9, 0.8,
   ARRAY[]::TEXT[], 'spine'),

  ('retrieval-quality', 'Retrieval Quality & Reranking',
   'Hybrid search, rerankers, and measuring recall. Where most RAG systems quietly fail.',
   6, 6, 3, 1, 8, 18, 40, 0.9, 0.5, 0.95, 0.85, 0.7,
   ARRAY[]::TEXT[], 'spine'),

  ('rag-evaluation', 'Evaluating RAG',
   'Faithfulness, answer relevance, context precision. Knowing whether your RAG is grounded or hallucinating.',
   6, 7, 3, 1, 8, 18, 40, 0.95, 0.55, 0.95, 0.85, 0.75,
   ARRAY[]::TEXT[], 'spine'),

  ('agent-loops', 'Agent Loops (Reason + Act)',
   'The reason–act–observe cycle, with tools and stopping conditions. The core loop under every agent.',
   6, 8, 3, 1, 8, 20, 45, 0.85, 0.6, 0.85, 0.95, 0.7,
   ARRAY[]::TEXT[], 'spine'),

  ('agent-memory-planning', 'Planning & Memory',
   'Task decomposition, short- and long-term memory, reflection. What turns a chatbot into an agent.',
   6, 9, 4, 1, 8, 22, 48, 0.8, 0.7, 0.8, 0.9, 0.7,
   ARRAY[]::TEXT[], 'spine'),

  ('mcp-protocol', 'Model Context Protocol (MCP)',
   'A standard way to expose tools and data to models. The integration layer agents are converging on.',
   6, 10, 2, 1, 6, 14, 28, 0.8, 0.4, 0.9, 1.0, 0.65,
   ARRAY[]::TEXT[], 'spine'),

  -- Phase 7 — Evaluation & Production (spine)
  ('eval-criteria', 'Defining Eval Criteria',
   'Task-specific rubrics and labeled test sets. You cannot improve an LLM feature you cannot measure.',
   7, 4, 2, 1, 6, 16, 36, 0.95, 0.6, 0.95, 0.9, 0.85,
   ARRAY[]::TEXT[], 'spine'),

  ('llm-as-judge', 'LLM-as-Judge',
   'Using a model to grade model output — and validating the judge against humans. Scalable eval, with caveats.',
   7, 5, 3, 1, 6, 16, 36, 0.9, 0.7, 0.9, 0.85, 0.8,
   ARRAY[]::TEXT[], 'spine'),

  ('abuse-prevention', 'Security & Abuse Prevention',
   'Prompt injection, data exfiltration, and input/output guards. The threats unique to LLM apps.',
   7, 6, 3, 1, 6, 16, 40, 1.0, 0.5, 0.95, 0.9, 0.7,
   ARRAY[]::TEXT[], 'spine')

ON CONFLICT (id) DO NOTHING;

-- 5. Edges for the new spine nodes ------------------------------------------

INSERT INTO master_roadmap_edges (from_node_id, to_node_id, edge_type)
VALUES
  -- Working with LLMs (entry of the builder spine)
  ('llm-mental-model',         'calling-model-apis',       'required'),
  ('calling-model-apis',       'structured-output',        'required'),
  ('calling-model-apis',       'prompt-engineering',       'required'),
  ('structured-output',        'tool-use-function-calling','recommended'),
  ('prompt-engineering',       'customization-decision',   'recommended'),
  ('customization-decision',   'fine-tuning-lora',         'recommended'),
  ('dataset-curation',         'fine-tuning-lora',         'required'),

  -- RAG
  ('embeddings-tokenization',  'document-chunking',        'required'),
  ('document-chunking',        'vector-databases',         'required'),
  ('vector-databases',         'retrieval-quality',        'required'),
  ('retrieval-quality',        'rag-engineering',          'required'),
  ('rag-engineering',          'rag-evaluation',           'required'),
  ('rag-evaluation',           'eval-criteria',            'recommended'),

  -- Agents
  ('agent-architectures',      'agent-loops',              'required'),
  ('agent-loops',              'agent-memory-planning',    'required'),
  ('agent-memory-planning',    'multi-agent-systems',      'recommended'),
  ('tool-use-function-calling','mcp-protocol',             'required'),

  -- Evaluation & Production
  ('evaluation-llms',          'eval-criteria',            'required'),
  ('eval-criteria',            'llm-as-judge',             'required'),
  ('llm-as-judge',             'observability-monitoring', 'recommended'),
  ('safety-guardrails',        'abuse-prevention',         'required')

ON CONFLICT (from_node_id, to_node_id) DO NOTHING;

-- 6. Curated starting resource per new node ---------------------------------
-- One strong pick each; the curation layer (best-in-class videos per node) is
-- expanded on top of these over time.

INSERT INTO master_roadmap_resources
  (node_id, title, url, resource_type, depth_level, estimated_minutes)
VALUES
  ('llm-mental-model', 'Intro to Large Language Models', 'https://www.youtube.com/watch?v=zjkBMFhNj_g', 'video', 'working', 60),
  ('calling-model-apis', 'Anthropic API — Get Started', 'https://docs.anthropic.com/en/docs/get-started', 'docs', 'working', 45),
  ('structured-output', 'Structured Outputs Guide', 'https://platform.openai.com/docs/guides/structured-outputs', 'docs', 'working', 45),
  ('customization-decision', 'Optimizing LLM Accuracy', 'https://platform.openai.com/docs/guides/optimizing-llm-accuracy', 'docs', 'working', 45),
  ('dataset-curation', 'Fine-tuning Guide', 'https://platform.openai.com/docs/guides/fine-tuning', 'docs', 'working', 60),
  ('document-chunking', 'Chunking Strategies for LLM Applications', 'https://www.pinecone.io/learn/chunking-strategies/', 'blog', 'working', 30),
  ('retrieval-quality', 'Introducing Contextual Retrieval', 'https://www.anthropic.com/news/contextual-retrieval', 'blog', 'working', 30),
  ('rag-evaluation', 'Ragas Documentation', 'https://docs.ragas.io/', 'docs', 'working', 45),
  ('agent-loops', 'Building Effective Agents', 'https://www.anthropic.com/engineering/building-effective-agents', 'blog', 'working', 30),
  ('agent-memory-planning', 'Reflexion: Language Agents with Verbal Reinforcement Learning', 'https://arxiv.org/abs/2303.11366', 'paper', 'working', 40),
  ('mcp-protocol', 'Model Context Protocol — Introduction', 'https://modelcontextprotocol.io/introduction', 'docs', 'working', 30),
  ('eval-criteria', 'Your AI Product Needs Evals', 'https://hamel.dev/blog/posts/evals/', 'blog', 'working', 45),
  ('llm-as-judge', 'Judging LLM-as-a-Judge with MT-Bench', 'https://arxiv.org/abs/2306.05685', 'paper', 'working', 40),
  ('abuse-prevention', 'OWASP Top 10 for LLM Applications', 'https://owasp.org/www-project-top-10-for-large-language-model-applications/', 'docs', 'working', 45)
ON CONFLICT DO NOTHING;

-- 7. One runnable working-depth proof project per new node ------------------

INSERT INTO master_roadmap_projects
  (node_id, title, description, depth_level, deliverable, estimated_hours)
VALUES
  ('llm-mental-model', 'Build a token budget profiler', 'Visualize how a prompt tokenizes and how much of the context window it consumes, with a per-request cost estimate.', 'working', 'CLI that reports token counts, context usage, and estimated cost for any prompt.', 4),
  ('calling-model-apis', 'Build a streaming chat client', 'Write a CLI chat client with streaming responses, retries, and graceful handling of rate limits and errors.', 'working', 'Runnable client with streaming output and resilient error handling.', 5),
  ('structured-output', 'Build a schema-validated extractor', 'Extract structured records from unstructured text against a JSON schema, validating every response and logging failures.', 'working', 'Script that returns schema-conformant JSON with validation failures surfaced.', 5),
  ('customization-decision', 'Write an approach decision memo', 'For one real use case, prototype prompt-only, RAG, and fine-tune approaches and compare cost and quality.', 'working', 'Short report with measured tradeoffs and a justified recommendation.', 6),
  ('dataset-curation', 'Build a fine-tuning dataset', 'Assemble, clean, dedupe, and quality-filter a small instruction dataset, then document it.', 'working', 'Versioned JSONL dataset with a data card describing sources and filters.', 6),
  ('document-chunking', 'Benchmark chunking strategies', 'Compare fixed, recursive, and semantic chunking on retrieval quality for the same corpus.', 'working', 'Notebook comparing recall across chunking strategies.', 5),
  ('retrieval-quality', 'Add a reranker to a retriever', 'Take a baseline retriever, add a reranking stage, and measure the precision lift.', 'working', 'Before-and-after retrieval metrics report.', 5),
  ('rag-evaluation', 'Build a RAG eval harness', 'Create an eval set and score a RAG pipeline on faithfulness and answer relevance.', 'working', 'Automated eval report with per-question scores.', 6),
  ('agent-loops', 'Build a ReAct agent', 'Implement a reason–act–observe loop with tool calls and a stopping condition.', 'working', 'Runnable agent that solves a multi-step task, with a full trace log.', 8),
  ('agent-memory-planning', 'Add planning and memory to an agent', 'Give an agent task decomposition plus short- and long-term memory.', 'working', 'Agent that completes a task requiring recall across multiple turns.', 8),
  ('mcp-protocol', 'Ship an MCP server', 'Build an MCP server exposing a tool or data source and connect it to a client.', 'working', 'Working MCP server with at least one tool, verified against a client.', 6),
  ('eval-criteria', 'Define an eval rubric and test set', 'Write task-specific eval criteria and assemble a labeled test set for one LLM feature.', 'working', 'Rubric document plus a graded test set of 30+ examples.', 5),
  ('llm-as-judge', 'Build an LLM judge', 'Implement an LLM-as-judge grader and validate it against human labels.', 'working', 'Judge script with measured agreement against a human-labeled set.', 6),
  ('abuse-prevention', 'Run a prompt-injection red team', 'Attack your own LLM app, add input/output guards, and re-test to measure the reduction.', 'working', 'Report of successful attacks before and after mitigations.', 6)
ON CONFLICT DO NOTHING;

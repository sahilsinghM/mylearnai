-- Master roadmap nodes
CREATE TABLE IF NOT EXISTS master_roadmap_nodes (
  id                    TEXT PRIMARY KEY,  -- slug, e.g. "self-attention"
  title                 TEXT NOT NULL,
  blurb                 TEXT NOT NULL,
  phase                 SMALLINT NOT NULL CHECK (phase BETWEEN 1 AND 7),
  row_index             SMALLINT NOT NULL,  -- vertical position within phase column (0-based)
  category_tags         TEXT[] NOT NULL DEFAULT '{}',
  skip_for_levels       TEXT[] NOT NULL DEFAULT '{}',  -- programming levels that skip this node

  -- Depth-level descriptions (nullable — UI synthesises from blurb when absent)
  depth_awareness       TEXT,
  depth_working         TEXT,
  depth_fluent          TEXT,
  depth_expert          TEXT,

  -- Time estimates in hours per depth level
  hours_awareness       FLOAT NOT NULL,
  hours_working         FLOAT NOT NULL,
  hours_fluent          FLOAT NOT NULL,
  hours_expert          FLOAT NOT NULL,

  -- Domain relevance 0.0–1.0
  relevance_fintech     FLOAT NOT NULL DEFAULT 0.5,
  relevance_research    FLOAT NOT NULL DEFAULT 0.5,
  relevance_mlops       FLOAT NOT NULL DEFAULT 0.5,
  relevance_dev_tools   FLOAT NOT NULL DEFAULT 0.5,
  relevance_education_ai FLOAT NOT NULL DEFAULT 0.5,

  difficulty            SMALLINT NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  is_published          BOOLEAN NOT NULL DEFAULT TRUE,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Master roadmap edges
CREATE TABLE IF NOT EXISTS master_roadmap_edges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_node_id TEXT NOT NULL REFERENCES master_roadmap_nodes(id) ON DELETE CASCADE,
  to_node_id   TEXT NOT NULL REFERENCES master_roadmap_nodes(id) ON DELETE CASCADE,
  edge_type    TEXT NOT NULL CHECK (edge_type IN ('required', 'recommended', 'contextual')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (from_node_id, to_node_id)
);

-- Master roadmap resources
CREATE TABLE IF NOT EXISTS master_roadmap_resources (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id         TEXT NOT NULL REFERENCES master_roadmap_nodes(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  url             TEXT NOT NULL,
  resource_type   TEXT CHECK (resource_type IN ('paper', 'video', 'blog', 'docs', 'book')),
  depth_level     TEXT NOT NULL CHECK (depth_level IN ('awareness', 'working', 'fluent', 'expert')),
  estimated_minutes INT,
  is_free         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Master roadmap projects
CREATE TABLE IF NOT EXISTS master_roadmap_projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id         TEXT NOT NULL REFERENCES master_roadmap_nodes(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  depth_level     TEXT NOT NULL CHECK (depth_level IN ('working', 'fluent', 'expert')),
  deliverable     TEXT,
  estimated_hours FLOAT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mrn_phase     ON master_roadmap_nodes(phase, row_index);
CREATE INDEX IF NOT EXISTS idx_mre_from      ON master_roadmap_edges(from_node_id);
CREATE INDEX IF NOT EXISTS idx_mre_to        ON master_roadmap_edges(to_node_id);
CREATE INDEX IF NOT EXISTS idx_mrr_node      ON master_roadmap_resources(node_id, depth_level);
CREATE INDEX IF NOT EXISTS idx_mrp_node      ON master_roadmap_projects(node_id, depth_level);

-- RLS: publicly readable, service-role-only writes
ALTER TABLE master_roadmap_nodes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_roadmap_edges     ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_roadmap_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_roadmap_projects  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read nodes"     ON master_roadmap_nodes     FOR SELECT USING (true);
CREATE POLICY "public read edges"     ON master_roadmap_edges     FOR SELECT USING (true);
CREATE POLICY "public read resources" ON master_roadmap_resources FOR SELECT USING (true);
CREATE POLICY "public read projects"  ON master_roadmap_projects  FOR SELECT USING (true);

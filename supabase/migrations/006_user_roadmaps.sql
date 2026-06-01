-- One personalized roadmap per user.
CREATE TABLE IF NOT EXISTS user_roadmaps (
  user_id        UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  active_node_id TEXT REFERENCES master_roadmap_nodes(id),
  status         TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  generated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  agent_version  TEXT NOT NULL DEFAULT 'v1'
);

-- Per-user state for each Master Node included in the Personalized Roadmap.
CREATE TABLE IF NOT EXISTS user_node_states (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  node_id           TEXT NOT NULL REFERENCES master_roadmap_nodes(id) ON DELETE CASCADE,
  state             TEXT NOT NULL CHECK (state IN ('locked', 'available', 'in_progress', 'completed', 'skipped', 'deferred')),
  depth_target      TEXT NOT NULL CHECK (depth_target IN ('awareness', 'working', 'fluent', 'expert')),
  depth_achieved    TEXT CHECK (depth_achieved IN ('awareness', 'working', 'fluent', 'expert')),
  quiz_score_best   FLOAT CHECK (quiz_score_best BETWEEN 0 AND 1),
  quiz_attempts     INT NOT NULL DEFAULT 0 CHECK (quiz_attempts >= 0),
  project_submitted BOOLEAN NOT NULL DEFAULT FALSE,
  skip_reason       TEXT,
  skip_confidence   FLOAT CHECK (skip_confidence BETWEEN 0 AND 1),
  scheduled_week    INT NOT NULL CHECK (scheduled_week > 0),
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  UNIQUE (user_id, node_id)
);

-- Append-only audit trail for deterministic Adaptation Agent decisions.
CREATE TABLE IF NOT EXISTS roadmap_adaptation_log (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  decision_type    TEXT NOT NULL CHECK (decision_type IN ('INSERT', 'REMOVE')),
  affected_node_id TEXT NOT NULL REFERENCES master_roadmap_nodes(id),
  change_before    JSONB NOT NULL DEFAULT '{}',
  change_after     JSONB NOT NULL DEFAULT '{}',
  triggering_signals JSONB NOT NULL DEFAULT '{}',
  reasoning        TEXT NOT NULL,
  confidence       FLOAT CHECK (confidence BETWEEN 0 AND 1),
  status           TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'overridden', 'auto_applied')),
  agent_run_id     UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_node_states_user_state
  ON user_node_states(user_id, state);
CREATE INDEX IF NOT EXISTS idx_roadmap_adaptation_log_user_created
  ON roadmap_adaptation_log(user_id, created_at DESC);

ALTER TABLE user_roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_node_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_adaptation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_roadmap" ON user_roadmaps
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_update_own_roadmap" ON user_roadmaps
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "users_read_own_node_states" ON user_node_states
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_update_own_node_states" ON user_node_states
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "users_read_own_adaptation_log" ON roadmap_adaptation_log
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_update_own_adaptation_log" ON roadmap_adaptation_log
  FOR UPDATE USING (auth.uid() = user_id);

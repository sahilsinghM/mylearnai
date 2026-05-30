CREATE TABLE tutor_sessions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_date        timestamptz NOT NULL DEFAULT now(),
  week_topic          text NOT NULL,
  gaps                jsonb NOT NULL DEFAULT '[]',
  project_title       text,
  project_desc        text,
  acceptance_criteria jsonb NOT NULL DEFAULT '[]',
  proof_line          text,
  github_url          text,
  linkedin_published  boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX tutor_sessions_user_id_idx ON tutor_sessions(user_id);
CREATE INDEX tutor_sessions_created_at_idx ON tutor_sessions(created_at DESC);

ALTER TABLE tutor_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own sessions" ON tutor_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tutor_sessions_updated_at
  BEFORE UPDATE ON tutor_sessions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id                      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                   TEXT NOT NULL,
  display_name            TEXT,
  onboarding_completed_at TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- onboarding profiles
CREATE TABLE IF NOT EXISTS onboarding_profiles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  programming_level TEXT NOT NULL CHECK (programming_level IN ('beginner','intermediate','senior','staff')),
  languages         TEXT[] NOT NULL DEFAULT '{}',
  aiml_familiarity  TEXT NOT NULL CHECK (aiml_familiarity IN ('none','heard_of','used_tools','built_models','researcher')),
  math_confidence   TEXT NOT NULL CHECK (math_confidence IN ('low','medium','high','phd')),
  goals             TEXT[] NOT NULL DEFAULT '{}',
  hours_per_day     SMALLINT NOT NULL CHECK (hours_per_day BETWEEN 1 AND 12),
  interest_areas    TEXT[] NOT NULL DEFAULT '{}',
  courses_taken     TEXT[],
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- learning plans
CREATE TABLE IF NOT EXISTS learning_plans (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_number  SMALLINT NOT NULL DEFAULT 1,
  status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','superseded')),
  difficulty   TEXT NOT NULL CHECK (difficulty IN ('gentle','normal','accelerated')),
  plan_json    JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  starts_on    DATE NOT NULL,
  ends_on      DATE NOT NULL,
  claude_model TEXT NOT NULL DEFAULT 'claude-sonnet-4-6'
);

-- plan days
CREATE TABLE IF NOT EXISTS plan_days (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id    UUID NOT NULL REFERENCES learning_plans(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_number SMALLINT NOT NULL CHECK (day_number BETWEEN 1 AND 7),
  date_on    DATE NOT NULL,
  theme      TEXT NOT NULL,
  summary    TEXT,
  status     TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','skipped')),
  UNIQUE (plan_id, day_number)
);

-- tasks
CREATE TABLE IF NOT EXISTS tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_day_id  UUID NOT NULL REFERENCES plan_days(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  position     SMALLINT NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('study','build','review','exercise')),
  title        TEXT NOT NULL,
  description  TEXT,
  resource_url TEXT,
  duration_min SMALLINT,
  difficulty   TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','skipped','failed')),
  completed_at TIMESTAMPTZ,
  UNIQUE (plan_day_id, position)
);

-- task events (adaptation signal log)
CREATE TABLE IF NOT EXISTS task_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  task_id         UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  event_type      TEXT NOT NULL CHECK (event_type IN ('completed','skipped','failed','reopened')),
  difficulty_felt TEXT CHECK (difficulty_felt IN ('too_easy','just_right','too_hard')),
  note            TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- projects
CREATE TABLE IF NOT EXISTS projects (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id      UUID NOT NULL REFERENCES learning_plans(id),
  name         TEXT NOT NULL DEFAULT 'Build a Vector Search Engine from Scratch',
  description  TEXT,
  status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed')),
  started_at   TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- milestones
CREATE TABLE IF NOT EXISTS milestones (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  position     SMALLINT NOT NULL,
  title        TEXT NOT NULL,
  description  TEXT,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed')),
  completed_at TIMESTAMPTZ,
  UNIQUE (project_id, position)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_learning_plans_user_status ON learning_plans(user_id, status);
CREATE INDEX IF NOT EXISTS idx_plan_days_plan_id ON plan_days(plan_id);
CREATE INDEX IF NOT EXISTS idx_tasks_plan_day_id ON tasks(plan_day_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_task_events_user ON task_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_milestones_project ON milestones(project_id, position);

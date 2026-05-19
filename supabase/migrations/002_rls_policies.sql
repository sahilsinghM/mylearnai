-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

-- profiles: users own their profile
DROP POLICY IF EXISTS "users_own_profile" ON profiles;
CREATE POLICY "users_own_profile" ON profiles
  FOR ALL USING (auth.uid() = id);

-- onboarding_profiles
DROP POLICY IF EXISTS "users_own_onboarding" ON onboarding_profiles;
CREATE POLICY "users_own_onboarding" ON onboarding_profiles
  FOR ALL USING (auth.uid() = user_id);

-- learning_plans
DROP POLICY IF EXISTS "users_own_plans" ON learning_plans;
CREATE POLICY "users_own_plans" ON learning_plans
  FOR ALL USING (auth.uid() = user_id);

-- plan_days
DROP POLICY IF EXISTS "users_own_days" ON plan_days;
CREATE POLICY "users_own_days" ON plan_days
  FOR ALL USING (auth.uid() = user_id);

-- tasks
DROP POLICY IF EXISTS "users_own_tasks" ON tasks;
CREATE POLICY "users_own_tasks" ON tasks
  FOR ALL USING (auth.uid() = user_id);

-- task_events
DROP POLICY IF EXISTS "users_own_events" ON task_events;
CREATE POLICY "users_own_events" ON task_events
  FOR ALL USING (auth.uid() = user_id);

-- projects
DROP POLICY IF EXISTS "users_own_projects" ON projects;
CREATE POLICY "users_own_projects" ON projects
  FOR ALL USING (auth.uid() = user_id);

-- milestones
DROP POLICY IF EXISTS "users_own_milestones" ON milestones;
CREATE POLICY "users_own_milestones" ON milestones
  FOR ALL USING (auth.uid() = user_id);

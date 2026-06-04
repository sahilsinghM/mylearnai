-- Migration: user_resource_completions
-- Tracks which resources a user has marked as complete.

CREATE TABLE IF NOT EXISTS public.user_resource_completions (
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_id TEXT        NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, resource_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_resource_completions ENABLE ROW LEVEL SECURITY;

-- Policy: users can only see their own rows
CREATE POLICY "users_select_own_completions"
  ON public.user_resource_completions
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy: users can only insert their own rows
CREATE POLICY "users_insert_own_completions"
  ON public.user_resource_completions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: users can only delete their own rows
CREATE POLICY "users_delete_own_completions"
  ON public.user_resource_completions
  FOR DELETE
  USING (user_id = auth.uid());

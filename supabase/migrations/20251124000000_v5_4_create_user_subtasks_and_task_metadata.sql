-- Create user_subtasks table
CREATE TABLE IF NOT EXISTS user_subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add metadata column to user_tasks
ALTER TABLE user_tasks ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Enable RLS
ALTER TABLE user_subtasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_subtasks
CREATE POLICY "Users can view their own subtasks"
  ON user_subtasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subtasks"
  ON user_subtasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subtasks"
  ON user_subtasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subtasks"
  ON user_subtasks FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_subtasks_user_id ON user_subtasks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subtasks_task_id ON user_subtasks(task_id);

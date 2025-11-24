/*
  # Add Subtask Progress to User Tasks

  Adds a JSONB column `subtask_progress` to the `user_tasks` table to store the completion status of subtasks.
  
  1. Changes
    - Add `subtask_progress` column (JSONB, default '{}') to `user_tasks` table.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_tasks' AND column_name = 'subtask_progress'
  ) THEN
    ALTER TABLE user_tasks ADD COLUMN subtask_progress JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

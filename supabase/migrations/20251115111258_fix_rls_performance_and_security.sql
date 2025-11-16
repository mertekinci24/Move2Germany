/*
  # Fix RLS Performance and Security Issues

  ## Summary
  This migration optimizes Row Level Security policies and fixes function security issues.

  ## Changes Made

  ### 1. RLS Policy Performance Optimization
  All RLS policies are updated to use `(select auth.uid())` instead of `auth.uid()`.
  This prevents re-evaluation of auth functions for each row, significantly improving
  query performance at scale.

  **Tables Updated:**
  - users (2 policies)
  - user_tasks (4 policies)
  - documents (3 policies)
  - ai_conversations (3 policies)
  - ai_messages (2 policies)
  - audit_logs (1 policy)

  ### 2. Unused Index Removal
  Removes indexes that have not been used. These can be recreated later if needed
  when actual usage patterns emerge.

  ### 3. Function Security
  Fixes the `update_updated_at_column` function to have an immutable search_path,
  preventing security vulnerabilities.

  ## Security Impact
  - ✅ Improved RLS policy performance
  - ✅ Fixed function search_path security issue
  - ✅ Reduced index overhead
*/

-- Drop all existing RLS policies
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can read own tasks" ON user_tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON user_tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON user_tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON user_tasks;
DROP POLICY IF EXISTS "Users can read own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON documents;
DROP POLICY IF EXISTS "Users can read own conversations" ON ai_conversations;
DROP POLICY IF EXISTS "Users can insert own conversations" ON ai_conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON ai_conversations;
DROP POLICY IF EXISTS "Users can read own messages" ON ai_messages;
DROP POLICY IF EXISTS "Users can insert own messages" ON ai_messages;
DROP POLICY IF EXISTS "Users can read own audit logs" ON audit_logs;

-- Recreate users policies with optimized auth function calls
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- Recreate user_tasks policies with optimized auth function calls
CREATE POLICY "Users can read own tasks"
  ON user_tasks FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own tasks"
  ON user_tasks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own tasks"
  ON user_tasks FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own tasks"
  ON user_tasks FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Recreate documents policies with optimized auth function calls
CREATE POLICY "Users can read own documents"
  ON documents FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own documents"
  ON documents FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Recreate ai_conversations policies with optimized auth function calls
CREATE POLICY "Users can read own conversations"
  ON ai_conversations FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own conversations"
  ON ai_conversations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own conversations"
  ON ai_conversations FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Recreate ai_messages policies with optimized auth function calls
CREATE POLICY "Users can read own messages"
  ON ai_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ai_conversations
      WHERE ai_conversations.id = ai_messages.conversation_id
      AND ai_conversations.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert own messages"
  ON ai_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_conversations
      WHERE ai_conversations.id = conversation_id
      AND ai_conversations.user_id = (select auth.uid())
    )
  );

-- Recreate audit_logs policy with optimized auth function call
CREATE POLICY "Users can read own audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Drop unused indexes
-- These can be recreated later when actual usage patterns emerge
DROP INDEX IF EXISTS idx_user_tasks_user_id;
DROP INDEX IF EXISTS idx_user_tasks_status;
DROP INDEX IF EXISTS idx_documents_user_id;
DROP INDEX IF EXISTS idx_documents_task_id;
DROP INDEX IF EXISTS idx_ai_conversations_user_id;
DROP INDEX IF EXISTS idx_ai_messages_conversation_id;
DROP INDEX IF EXISTS idx_audit_logs_user_id;
DROP INDEX IF EXISTS idx_audit_logs_event_type;

-- Fix function security: Add immutable search_path
-- First drop the triggers, then the function
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_user_tasks_updated_at ON user_tasks;
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Recreate function with secure search_path
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate the triggers
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_tasks_updated_at 
  BEFORE UPDATE ON user_tasks
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
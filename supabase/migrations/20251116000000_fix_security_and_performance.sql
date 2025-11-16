/*
  # Fix Security and Performance Issues

  1. Performance Fixes
    - Add missing indexes for foreign keys
    - Optimize RLS policies with SELECT wrappers
    - Set immutable search paths for functions

  2. Security Fixes
    - Remove duplicate RLS policies
    - Keep existing security intact

  3. Cleanup
    - Remove unused indexes (will be recreated if needed)
*/

-- =====================================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id
ON ai_conversations(user_id);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id
ON ai_messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_community_messages_created_by
ON community_messages(created_by);

CREATE INDEX IF NOT EXISTS idx_community_replies_created_by
ON community_replies(created_by);

CREATE INDEX IF NOT EXISTS idx_community_topics_created_by
ON community_topics(created_by);

CREATE INDEX IF NOT EXISTS idx_documents_user_id
ON documents(user_id);

-- =====================================================
-- 2. DROP UNUSED INDEXES
-- =====================================================

DROP INDEX IF EXISTS idx_community_replies_topic;
DROP INDEX IF EXISTS idx_community_replies_created_at;
DROP INDEX IF EXISTS idx_community_messages_city;
DROP INDEX IF EXISTS idx_user_task_documents_user_task;
DROP INDEX IF EXISTS idx_community_topics_city;
DROP INDEX IF EXISTS idx_community_topics_module;
DROP INDEX IF EXISTS idx_community_topics_created_at;

-- =====================================================
-- 3. FIX RLS POLICIES - AUTH FUNCTION OPTIMIZATION
-- =====================================================

-- community_replies
DROP POLICY IF EXISTS "Users can create replies" ON community_replies;
CREATE POLICY "Users can create replies"
  ON community_replies FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can soft delete own replies" ON community_replies;
CREATE POLICY "Users can soft delete own replies"
  ON community_replies FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = created_by)
  WITH CHECK ((SELECT auth.uid()) = created_by);

-- community_messages
DROP POLICY IF EXISTS "Users can create messages" ON community_messages;
CREATE POLICY "Users can create messages"
  ON community_messages FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can soft delete own messages" ON community_messages;
CREATE POLICY "Users can soft delete own messages"
  ON community_messages FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = created_by)
  WITH CHECK ((SELECT auth.uid()) = created_by);

-- community_topics
DROP POLICY IF EXISTS "Users can create topics" ON community_topics;
CREATE POLICY "Users can create topics"
  ON community_topics FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can update own topics" ON community_topics;
CREATE POLICY "Users can update own topics"
  ON community_topics FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = created_by)
  WITH CHECK ((SELECT auth.uid()) = created_by);

-- user_task_documents - fix existing policies
DROP POLICY IF EXISTS "Users can view and manage own documents" ON user_task_documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON user_task_documents;
DROP POLICY IF EXISTS "Users can update own documents" ON user_task_documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON user_task_documents;

CREATE POLICY "Users can view own documents"
  ON user_task_documents FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own documents"
  ON user_task_documents FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own documents"
  ON user_task_documents FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own documents"
  ON user_task_documents FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- =====================================================
-- 4. FIX FUNCTION SEARCH PATHS
-- =====================================================

CREATE OR REPLACE FUNCTION update_topic_reply_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NOT NEW.is_deleted THEN
    UPDATE community_topics SET reply_count = reply_count + 1 WHERE id = NEW.topic_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_deleted = FALSE AND NEW.is_deleted = TRUE THEN
      UPDATE community_topics SET reply_count = GREATEST(reply_count - 1, 0) WHERE id = NEW.topic_id;
    ELSIF OLD.is_deleted = TRUE AND NEW.is_deleted = FALSE THEN
      UPDATE community_topics SET reply_count = reply_count + 1 WHERE id = NEW.topic_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND NOT OLD.is_deleted THEN
    UPDATE community_topics SET reply_count = GREATEST(reply_count - 1, 0) WHERE id = OLD.topic_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

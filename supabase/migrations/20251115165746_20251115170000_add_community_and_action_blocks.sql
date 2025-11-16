/*
  # V4.2: Community & Action Blocks

  1. New Tables
    - `community_topics` - Forum topics/posts by city and module
    - `community_replies` - Replies to forum topics
    - `community_messages` - City-based chat messages
    - `user_task_documents` - Document checklist for tasks

  2. Updates
    - Add `role` column to users (user | admin)

  3. Security
    - RLS on all tables
    - Users can CRUD own content
    - Admins can moderate
*/

-- Add role column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'role'
  ) THEN
    ALTER TABLE users ADD COLUMN role text DEFAULT 'user' CHECK (role IN ('user', 'admin'));
  END IF;
END $$;

-- Community Topics
CREATE TABLE IF NOT EXISTS community_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id text,
  module_id text,
  title text NOT NULL,
  body text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_deleted boolean DEFAULT false,
  reply_count int DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_community_topics_city ON community_topics(city_id) WHERE NOT is_deleted;
CREATE INDEX IF NOT EXISTS idx_community_topics_module ON community_topics(module_id) WHERE NOT is_deleted;
CREATE INDEX IF NOT EXISTS idx_community_topics_created_at ON community_topics(created_at DESC) WHERE NOT is_deleted;

ALTER TABLE community_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view non-deleted topics"
  ON community_topics FOR SELECT
  TO authenticated
  USING (is_deleted = false);

CREATE POLICY "Users can create topics"
  ON community_topics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own topics"
  ON community_topics FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Community Replies
CREATE TABLE IF NOT EXISTS community_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid REFERENCES community_topics(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  is_deleted boolean DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_community_replies_topic ON community_replies(topic_id) WHERE NOT is_deleted;
CREATE INDEX IF NOT EXISTS idx_community_replies_created_at ON community_replies(created_at ASC);

ALTER TABLE community_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view non-deleted replies"
  ON community_replies FOR SELECT
  TO authenticated
  USING (is_deleted = false);

CREATE POLICY "Users can create replies"
  ON community_replies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can soft delete own replies"
  ON community_replies FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by AND is_deleted = true);

-- Trigger for reply_count
CREATE OR REPLACE FUNCTION update_topic_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.is_deleted = false THEN
    UPDATE community_topics SET reply_count = reply_count + 1 WHERE id = NEW.topic_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_deleted = false AND NEW.is_deleted = true THEN
      UPDATE community_topics SET reply_count = GREATEST(reply_count - 1, 0) WHERE id = NEW.topic_id;
    ELSIF OLD.is_deleted = true AND NEW.is_deleted = false THEN
      UPDATE community_topics SET reply_count = reply_count + 1 WHERE id = NEW.topic_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_reply_count ON community_replies;
CREATE TRIGGER trigger_update_reply_count
  AFTER INSERT OR UPDATE ON community_replies
  FOR EACH ROW
  EXECUTE FUNCTION update_topic_reply_count();

-- Community Messages
CREATE TABLE IF NOT EXISTS community_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id text NOT NULL,
  body text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  is_deleted boolean DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_community_messages_city ON community_messages(city_id, created_at DESC) WHERE NOT is_deleted;

ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view non-deleted messages"
  ON community_messages FOR SELECT
  TO authenticated
  USING (is_deleted = false);

CREATE POLICY "Users can create messages"
  ON community_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can soft delete own messages"
  ON community_messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by AND is_deleted = true);

-- User Task Documents
CREATE TABLE IF NOT EXISTS user_task_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id text NOT NULL,
  document_id text NOT NULL,
  is_checked boolean DEFAULT false,
  checked_at timestamptz,
  UNIQUE(user_id, task_id, document_id)
);

CREATE INDEX IF NOT EXISTS idx_user_task_documents_user_task ON user_task_documents(user_id, task_id);

ALTER TABLE user_task_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents"
  ON user_task_documents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own documents"
  ON user_task_documents FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_community_topics_updated_at ON community_topics;
CREATE TRIGGER trigger_community_topics_updated_at
  BEFORE UPDATE ON community_topics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
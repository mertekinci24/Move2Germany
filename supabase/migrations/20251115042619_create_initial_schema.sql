/*
  # Move2Germany Initial Schema

  ## Summary
  Creates the foundational database schema for Move2Germany V1 application.

  ## New Tables
  
  ### `users`
  - `id` (uuid, primary key) - User unique identifier
  - `email` (text, unique) - User email address
  - `password_hash` (text) - Securely hashed password
  - `locale` (text) - User language preference (tr/en)
  - `primary_city_id` (text) - Selected city
  - `arrival_date` (date) - Planned/actual arrival date
  - `persona_type` (text) - student or worker
  - `german_level` (text) - A1-C1 language level
  - `budget_range` (text) - Budget category
  - `onboarding_completed` (boolean) - Onboarding status
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  - `deleted_at` (timestamptz) - Soft delete timestamp

  ### `user_tasks`
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key) - Reference to users
  - `task_id` (text) - Task identifier from JSON config
  - `status` (text) - todo/in_progress/done/blocked
  - `notes` (text) - User notes
  - `custom_due_date` (date) - User-set deadline
  - `completed_at` (timestamptz) - Completion timestamp
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `documents`
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key)
  - `task_id` (text) - Associated task
  - `storage_key` (text) - S3/Storage path
  - `file_name` (text) - Original filename
  - `mime_type` (text) - File type
  - `size` (bigint) - File size in bytes
  - `uploaded_at` (timestamptz)

  ### `ai_conversations`
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key)
  - `started_at` (timestamptz)
  - `ended_at` (timestamptz)

  ### `ai_messages`
  - `id` (uuid, primary key)
  - `conversation_id` (uuid, foreign key)
  - `role` (text) - user/assistant/system
  - `content` (text) - Message content
  - `created_at` (timestamptz)

  ### `audit_logs`
  - `id` (uuid, primary key)
  - `user_id` (uuid)
  - `event_type` (text) - login/task_update/document_upload/ai_call
  - `payload_json` (jsonb) - Event data
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Restrictive policies for authenticated users only
  - Users can only access their own data
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  locale text DEFAULT 'en',
  primary_city_id text,
  arrival_date date,
  persona_type text,
  german_level text,
  budget_range text,
  onboarding_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- Create user_tasks table
CREATE TABLE IF NOT EXISTS user_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id text NOT NULL,
  status text DEFAULT 'todo',
  notes text,
  custom_due_date date,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, task_id)
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id text,
  storage_key text NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  size bigint NOT NULL,
  uploaded_at timestamptz DEFAULT now()
);

-- Create ai_conversations table
CREATE TABLE IF NOT EXISTS ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz
);

-- Create ai_messages table
CREATE TABLE IF NOT EXISTS ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  event_type text NOT NULL,
  payload_json jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- User tasks policies
CREATE POLICY "Users can read own tasks"
  ON user_tasks FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own tasks"
  ON user_tasks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own tasks"
  ON user_tasks FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own tasks"
  ON user_tasks FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Documents policies
CREATE POLICY "Users can read own documents"
  ON documents FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own documents"
  ON documents FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- AI conversations policies
CREATE POLICY "Users can read own conversations"
  ON ai_conversations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own conversations"
  ON ai_conversations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own conversations"
  ON ai_conversations FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- AI messages policies
CREATE POLICY "Users can read own messages"
  ON ai_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ai_conversations
      WHERE ai_conversations.id = ai_messages.conversation_id
      AND ai_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own messages"
  ON ai_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_conversations
      WHERE ai_conversations.id = conversation_id
      AND ai_conversations.user_id = auth.uid()
    )
  );

-- Audit logs policies (read-only for users)
CREATE POLICY "Users can read own audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_tasks_user_id ON user_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tasks_status ON user_tasks(status);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_task_id ON documents(task_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_tasks_updated_at BEFORE UPDATE ON user_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
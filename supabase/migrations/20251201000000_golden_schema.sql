/*
  # Move2Germany Golden Schema (Consolidated)
  # Generated: 2025-12-01
  
  ## Summary
  This is the consolidated "Golden Schema" that defines the entire database structure 
  for the Move2Germany application. It replaces all previous migration files to 
  eliminate schema drift and ensure a clean state.

  ## Contents
  1. Schema Reset (DROP & CREATE public)
  2. Extensions (uuid-ossp, vector, pgcrypto)
  3. Tables & Indexes
  4. Functions & Triggers
  5. Row Level Security (RLS) Policies
  6. Auth Integration
*/

-- =====================================================
-- 1. SCHEMA RESET
-- =====================================================
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- =====================================================
-- 2. EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 3. TABLES & INDEXES
-- =====================================================

-- USERS
CREATE TABLE public.users (
    id uuid REFERENCES auth.users(id) NOT NULL PRIMARY KEY,
    email text UNIQUE,
    full_name text,
    avatar_url text,
    role text DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    locale text DEFAULT 'en',
    primary_city_id text,
    arrival_date date,
    persona_type text,
    german_level text,
    budget_range text,
    onboarding_completed boolean DEFAULT false,
    needs_password_reset boolean DEFAULT false,
    migrated_to_supabase_auth boolean DEFAULT false,
    migration_date timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    deleted_at timestamptz
);

-- USER TASKS
CREATE TABLE public.user_tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    task_id text NOT NULL,
    status text DEFAULT 'todo',
    notes text,
    custom_due_date date,
    completed_at timestamptz,
    subtask_progress jsonb DEFAULT '{}'::jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    title text,
    description text,
    module text,
    time_window text,
    is_system_generated boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, task_id)
);
CREATE INDEX idx_user_tasks_user_id ON public.user_tasks(user_id);
CREATE INDEX idx_user_tasks_status ON public.user_tasks(status);
CREATE INDEX idx_user_tasks_is_system_generated ON public.user_tasks(is_system_generated);

-- USER SUBTASKS
CREATE TABLE public.user_subtasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    task_id text NOT NULL,
    title text NOT NULL CHECK (length(trim(title)) > 0),
    is_completed boolean DEFAULT FALSE,
    "order" integer DEFAULT 0,
    created_at timestamptz DEFAULT NOW(),
    updated_at timestamptz DEFAULT NOW()
);
CREATE INDEX idx_user_subtasks_user_task ON public.user_subtasks(user_id, task_id);

-- DOCUMENTS (RAG)
CREATE TABLE public.documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE, -- Nullable for system docs
    task_id text,
    storage_key text NOT NULL,
    file_name text NOT NULL,
    mime_type text NOT NULL,
    size bigint NOT NULL,
    uploaded_at timestamptz DEFAULT now(),
    content text,
    metadata jsonb,
    embedding vector(768),
    parent_id uuid,
    generated_questions jsonb
);
CREATE INDEX idx_documents_user_id ON public.documents(user_id);
CREATE INDEX idx_documents_task_id ON public.documents(task_id);
CREATE INDEX documents_embedding_idx ON public.documents USING hnsw (embedding vector_cosine_ops);

-- NOTES
CREATE TABLE public.notes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title text,
    content text,
    related_task_id text,
    city_id text,
    module_id text,
    event_date timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_notes_related_task ON public.notes(related_task_id);
CREATE INDEX idx_notes_event_date ON public.notes(event_date);

-- EVENTS
CREATE TABLE public.events (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id text NOT NULL,
    title text NOT NULL,
    description text,
    start_time timestamptz NOT NULL,
    end_time timestamptz,
    venue_name text,
    address text,
    is_free boolean DEFAULT FALSE,
    price_min decimal(10, 2),
    price_max decimal(10, 2),
    currency text DEFAULT 'EUR',
    source_type text NOT NULL,
    source_name text,
    source_url text,
    language text DEFAULT 'en',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- USER POINTS
CREATE TABLE public.user_points (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
    task_id text,
    action_type text NOT NULL,
    points integer NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- COMMUNITY TOPICS
CREATE TABLE public.community_topics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id text,
    module_id text,
    title text NOT NULL,
    body text NOT NULL,
    created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
    status text DEFAULT 'active',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    deleted_at timestamptz,
    is_deleted boolean DEFAULT false,
    reply_count int DEFAULT 0
);
CREATE INDEX idx_community_topics_created_by ON public.community_topics(created_by);

-- COMMUNITY REPLIES
CREATE TABLE public.community_replies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id uuid REFERENCES public.community_topics(id) ON DELETE CASCADE,
    created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
    body text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    deleted_at timestamptz,
    is_deleted boolean DEFAULT false
);
CREATE INDEX idx_community_replies_created_by ON public.community_replies(created_by);

-- COMMUNITY MESSAGES
CREATE TABLE public.community_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id text NOT NULL,
    body text NOT NULL,
    created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    is_deleted boolean DEFAULT false
);
CREATE INDEX idx_community_messages_created_by ON public.community_messages(created_by);

-- COMMUNITY REPORTS
CREATE TABLE public.community_reports (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_type text NOT NULL,
    target_id uuid NOT NULL,
    reporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    reason text NOT NULL,
    status text DEFAULT 'pending',
    created_at timestamptz DEFAULT now()
);

-- USER TASK DOCUMENTS (Checklist)
CREATE TABLE public.user_task_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    task_id text NOT NULL,
    document_id text NOT NULL,
    is_checked boolean DEFAULT false,
    checked_at timestamptz,
    UNIQUE(user_id, task_id, document_id)
);

-- AI CONVERSATIONS
CREATE TABLE public.ai_conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    started_at timestamptz DEFAULT now(),
    ended_at timestamptz
);
CREATE INDEX idx_ai_conversations_user_id ON public.ai_conversations(user_id);

-- AI MESSAGES
CREATE TABLE public.ai_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    role text NOT NULL,
    content text NOT NULL,
    created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_ai_messages_conversation_id ON public.ai_messages(conversation_id);

-- AUDIT LOGS
CREATE TABLE public.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    event_type text NOT NULL,
    payload_json jsonb,
    created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_event_type ON public.audit_logs(event_type);

-- LEGACY AUTH BACKUP
CREATE TABLE public.legacy_auth_backup (
    id uuid PRIMARY KEY,
    email text NOT NULL,
    password_hash text NOT NULL,
    migrated_at timestamptz DEFAULT now(),
    backed_up_at timestamptz DEFAULT now()
);

-- =====================================================
-- 4. FUNCTIONS & TRIGGERS
-- =====================================================

-- Update updated_at column
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

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_tasks_updated_at BEFORE UPDATE ON public.user_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_subtasks_updated_at BEFORE UPDATE ON public.user_subtasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_community_topics_updated_at BEFORE UPDATE ON public.community_topics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_community_replies_updated_at BEFORE UPDATE ON public.community_replies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update topic reply count
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

CREATE TRIGGER trigger_update_reply_count
  AFTER INSERT OR UPDATE ON public.community_replies
  FOR EACH ROW
  EXECUTE FUNCTION update_topic_reply_count();

-- Handle new user (Sync Auth -> Public)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at)
  VALUES (NEW.id, NEW.email, NEW.created_at)
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    needs_password_reset = false,
    migrated_to_supabase_auth = true,
    migration_date = now();
  RETURN NEW;
END;
$$;

-- Trigger on auth.users (Needs special permissions, but included for completeness)
-- Note: In Supabase, you might need to run this part via dashboard or with superuser privileges if migration fails.
-- We'll wrap it in a DO block to avoid failure if permissions are missing.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    DROP TRIGGER on_auth_user_created ON auth.users;
  END IF;
  
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not create trigger on auth.users (likely permission issue). Please create manually.';
END $$;

-- Cleanup legacy auth backup
CREATE OR REPLACE FUNCTION cleanup_legacy_auth_backup()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM legacy_auth_backup
  WHERE backed_up_at < now() - interval '90 days';
END;
$$;

-- Match Documents (RAG)
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  generated_questions jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.content,
    documents.metadata,
    documents.generated_questions,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE 1 - (documents.embedding <=> query_embedding) > match_threshold
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_task_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legacy_auth_backup ENABLE ROW LEVEL SECURITY;

-- USERS
CREATE POLICY "Users can read own profile" ON public.users FOR SELECT TO authenticated USING (id = (select auth.uid()));
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE TO authenticated USING (id = (select auth.uid())) WITH CHECK (id = (select auth.uid()));

-- USER TASKS
CREATE POLICY "Users can read own tasks" ON public.user_tasks FOR SELECT TO authenticated USING (user_id = (select auth.uid()));
CREATE POLICY "Users can insert own tasks" ON public.user_tasks FOR INSERT TO authenticated WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can update own tasks" ON public.user_tasks FOR UPDATE TO authenticated USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can delete own tasks" ON public.user_tasks FOR DELETE TO authenticated USING (user_id = (select auth.uid()));

-- USER SUBTASKS
CREATE POLICY "Users can view own subtasks" ON public.user_subtasks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own subtasks" ON public.user_subtasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subtasks" ON public.user_subtasks FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own subtasks" ON public.user_subtasks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- DOCUMENTS
CREATE POLICY "Public Read Access" ON public.documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin Write Access" ON public.documents FOR ALL TO service_role USING (true) WITH CHECK (true);

-- NOTES
CREATE POLICY "Users can CRUD their own notes" ON public.notes FOR ALL USING (auth.uid() = user_id);

-- EVENTS
CREATE POLICY "Events are viewable by everyone" ON public.events FOR SELECT USING (true);
CREATE POLICY "Admins can insert/update/delete events" ON public.events FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- USER POINTS
CREATE POLICY "Users can view their own points" ON public.user_points FOR SELECT USING (auth.uid() = user_id);

-- COMMUNITY TOPICS
CREATE POLICY "Topics are viewable by everyone" ON public.community_topics FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "Users can create topics" ON public.community_topics FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own topics" ON public.community_topics FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can soft delete own topics" ON public.community_topics FOR UPDATE USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by AND is_deleted = true);

-- COMMUNITY REPLIES
CREATE POLICY "Replies are viewable by everyone" ON public.community_replies FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "Users can create replies" ON public.community_replies FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can soft delete own replies" ON public.community_replies FOR UPDATE USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by AND is_deleted = true);

-- COMMUNITY MESSAGES
CREATE POLICY "Anyone can view non-deleted messages" ON public.community_messages FOR SELECT USING (is_deleted = false);
CREATE POLICY "Users can create messages" ON public.community_messages FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can soft delete own messages" ON public.community_messages FOR UPDATE USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by AND is_deleted = true);

-- COMMUNITY REPORTS
CREATE POLICY "Users can create reports" ON public.community_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Admins can view reports" ON public.community_reports FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- USER TASK DOCUMENTS
CREATE POLICY "Users can view own documents" ON public.user_task_documents FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can insert own documents" ON public.user_task_documents FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update own documents" ON public.user_task_documents FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete own documents" ON public.user_task_documents FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

-- AI CONVERSATIONS
CREATE POLICY "Users can read own conversations" ON public.ai_conversations FOR SELECT TO authenticated USING (user_id = (select auth.uid()));
CREATE POLICY "Users can insert own conversations" ON public.ai_conversations FOR INSERT TO authenticated WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can update own conversations" ON public.ai_conversations FOR UPDATE TO authenticated USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

-- AI MESSAGES
CREATE POLICY "Users can read own messages" ON public.ai_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.ai_conversations WHERE ai_conversations.id = ai_messages.conversation_id AND ai_conversations.user_id = (select auth.uid())));
CREATE POLICY "Users can insert own messages" ON public.ai_messages FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.ai_conversations WHERE ai_conversations.id = conversation_id AND ai_conversations.user_id = (select auth.uid())));

-- AUDIT LOGS
CREATE POLICY "Users can read own audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (user_id = (select auth.uid()));
CREATE POLICY "Users can insert their own audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- LEGACY AUTH BACKUP
CREATE POLICY "Only service role can access legacy auth backup" ON public.legacy_auth_backup FOR ALL TO service_role USING (true) WITH CHECK (true);

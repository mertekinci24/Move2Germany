/*
  MOVE2GERMANY FULL DATABASE SETUP SCRIPT
  Generated on: 2025-11-21
  
  INSTRUCTIONS:
  1. Open Supabase Dashboard -> SQL Editor.
  2. Paste this entire script.
  3. Run it.
  
  CONTENTS:
  1. Extensions
  2. Core Tables (users, tasks, documents, AI, audit)
  3. V5 Feature Tables (notes, events, points, community)
  4. Triggers & Functions
  5. RLS Policies
*/

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CORE TABLES

-- USERS
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Matches auth.users.id usually
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    locale TEXT DEFAULT 'en',
    primary_city_id TEXT,
    arrival_date DATE,
    persona_type TEXT,
    german_level TEXT,
    budget_range TEXT,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- USER TASKS
CREATE TABLE IF NOT EXISTS public.user_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    task_id TEXT NOT NULL,
    status TEXT DEFAULT 'todo', -- todo, in_progress, done, blocked
    notes TEXT,
    custom_due_date DATE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, task_id)
);

-- DOCUMENTS
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    task_id TEXT,
    storage_key TEXT NOT NULL,
    file_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size BIGINT NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI CONVERSATIONS
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);

-- AI MESSAGES
CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL, -- user, assistant, system
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    event_type TEXT NOT NULL,
    payload_json JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. V5 FEATURE TABLES

-- NOTES
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT,
    related_task_id TEXT,
    city_id TEXT,
    module_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- EVENTS
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    venue_name TEXT,
    address TEXT,
    is_free BOOLEAN DEFAULT FALSE,
    price_min DECIMAL(10, 2),
    price_max DECIMAL(10, 2),
    currency TEXT DEFAULT 'EUR',
    source_type TEXT NOT NULL, -- 'official', 'community', 'platform'
    source_name TEXT,
    source_url TEXT,
    language TEXT DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- USER POINTS
CREATE TABLE IF NOT EXISTS public.user_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    task_id TEXT,
    action_type TEXT NOT NULL, -- 'TASK_COMPLETED', 'EVENT_ATTENDED', 'FORUM_POST'
    points INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- COMMUNITY TOPICS
CREATE TABLE IF NOT EXISTS public.community_topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id TEXT NOT NULL,
    module_id TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active', -- 'active', 'locked', 'hidden'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- COMMUNITY REPLIES
CREATE TABLE IF NOT EXISTS public.community_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id UUID NOT NULL REFERENCES public.community_topics(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- COMMUNITY REPORTS
CREATE TABLE IF NOT EXISTS public.community_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_type TEXT NOT NULL, -- 'topic', 'reply'
    target_id UUID NOT NULL,
    reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'resolved', 'dismissed'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- COMMUNITY MESSAGES (City Chat)
CREATE TABLE IF NOT EXISTS public.community_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id TEXT NOT NULL,
    body TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- USER TASK DOCUMENTS (Checklists)
CREATE TABLE IF NOT EXISTS public.user_task_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    task_id TEXT NOT NULL,
    document_id TEXT NOT NULL,
    is_checked BOOLEAN DEFAULT FALSE,
    checked_at TIMESTAMPTZ,
    UNIQUE(user_id, task_id, document_id)
);

-- 4. FUNCTIONS & TRIGGERS

-- Updated At Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply Triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_tasks_updated_at ON public.user_tasks;
CREATE TRIGGER update_user_tasks_updated_at BEFORE UPDATE ON public.user_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notes_updated_at ON public.notes;
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_community_topics_updated_at ON public.community_topics;
CREATE TRIGGER update_community_topics_updated_at BEFORE UPDATE ON public.community_topics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_community_replies_updated_at ON public.community_replies;
CREATE TRIGGER update_community_replies_updated_at BEFORE UPDATE ON public.community_replies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. RLS POLICIES

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_task_documents ENABLE ROW LEVEL SECURITY;

-- USERS Policies
CREATE POLICY "Users can read own profile" ON public.users FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- USER TASKS Policies
CREATE POLICY "Users can read own tasks" ON public.user_tasks FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own tasks" ON public.user_tasks FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own tasks" ON public.user_tasks FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own tasks" ON public.user_tasks FOR DELETE TO authenticated USING (user_id = auth.uid());

-- DOCUMENTS Policies
CREATE POLICY "Users can read own documents" ON public.documents FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own documents" ON public.documents FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own documents" ON public.documents FOR DELETE TO authenticated USING (user_id = auth.uid());

-- AI Policies
CREATE POLICY "Users can read own conversations" ON public.ai_conversations FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own conversations" ON public.ai_conversations FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own conversations" ON public.ai_conversations FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read own messages" ON public.ai_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.ai_conversations WHERE ai_conversations.id = ai_messages.conversation_id AND ai_conversations.user_id = auth.uid()));
CREATE POLICY "Users can insert own messages" ON public.ai_messages FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.ai_conversations WHERE ai_conversations.id = conversation_id AND ai_conversations.user_id = auth.uid()));

-- AUDIT Policies
CREATE POLICY "Users can read own audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (user_id = auth.uid());

-- NOTES Policies
CREATE POLICY "Users can CRUD their own notes" ON public.notes FOR ALL USING (auth.uid() = user_id);

-- EVENTS Policies
CREATE POLICY "Events are viewable by everyone" ON public.events FOR SELECT USING (true);
CREATE POLICY "Admins can manage events" ON public.events FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- POINTS Policies
CREATE POLICY "Users can view their own points" ON public.user_points FOR SELECT USING (auth.uid() = user_id);

-- COMMUNITY TOPICS Policies
CREATE POLICY "Topics are viewable by everyone" ON public.community_topics FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "Users can create topics" ON public.community_topics FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update their own topics" ON public.community_topics FOR UPDATE USING (auth.uid() = author_id);

-- COMMUNITY REPLIES Policies
CREATE POLICY "Replies are viewable by everyone" ON public.community_replies FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "Users can create replies" ON public.community_replies FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update their own replies" ON public.community_replies FOR UPDATE USING (auth.uid() = author_id);

-- COMMUNITY REPORTS Policies
CREATE POLICY "Users can create reports" ON public.community_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Admins can view reports" ON public.community_reports FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- COMMUNITY MESSAGES Policies
CREATE POLICY "Anyone can view non-deleted messages" ON public.community_messages FOR SELECT TO authenticated USING (is_deleted = false);
CREATE POLICY "Users can create messages" ON public.community_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can soft delete own messages" ON public.community_messages FOR UPDATE TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by AND is_deleted = true);

-- USER TASK DOCUMENTS Policies
CREATE POLICY "Users can view own task docs" ON public.user_task_documents FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own task docs" ON public.user_task_documents FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. INDEXES
CREATE INDEX IF NOT EXISTS idx_user_tasks_user_id ON public.user_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tasks_status ON public.user_tasks(status);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON public.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);

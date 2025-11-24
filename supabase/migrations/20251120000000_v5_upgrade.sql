-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- NOTES TABLE
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT,
    content TEXT,
    related_task_id TEXT, -- config-based ID, not FK
    city_id TEXT,
    module_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD their own notes" ON notes
    FOR ALL USING (auth.uid() = user_id);

-- EVENTS TABLE
CREATE TABLE IF NOT EXISTS events (
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

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events are viewable by everyone" ON events
    FOR SELECT USING (true);

CREATE POLICY "Admins can insert/update/delete events" ON events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- USER POINTS TABLE
CREATE TABLE IF NOT EXISTS user_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    task_id TEXT,
    action_type TEXT NOT NULL, -- 'TASK_COMPLETED', 'EVENT_ATTENDED', 'FORUM_POST'
    points INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own points" ON user_points
    FOR SELECT USING (auth.uid() = user_id);

-- COMMUNITY TOPICS TABLE
CREATE TABLE IF NOT EXISTS community_topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id TEXT NOT NULL,
    module_id TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'active', -- 'active', 'locked', 'hidden'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

ALTER TABLE community_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Topics are viewable by everyone" ON community_topics
    FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "Users can create topics" ON community_topics
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own topics" ON community_topics
    FOR UPDATE USING (auth.uid() = author_id);

-- COMMUNITY REPLIES TABLE
CREATE TABLE IF NOT EXISTS community_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id UUID REFERENCES community_topics(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

ALTER TABLE community_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Replies are viewable by everyone" ON community_replies
    FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "Users can create replies" ON community_replies
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own replies" ON community_replies
    FOR UPDATE USING (auth.uid() = author_id);

-- COMMUNITY REPORTS TABLE
CREATE TABLE IF NOT EXISTS community_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_type TEXT NOT NULL, -- 'topic', 'reply'
    target_id UUID NOT NULL,
    reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'resolved', 'dismissed'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE community_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports" ON community_reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can view reports" ON community_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- TRIGGERS FOR UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_community_topics_updated_at BEFORE UPDATE ON community_topics FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_community_replies_updated_at BEFORE UPDATE ON community_replies FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

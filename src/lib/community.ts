import { supabase } from './supabase';

export type Topic = {
    id: string;
    city_id: string;
    module_id: string;
    title: string;
    body: string;
    author_id: string;
    status: 'active' | 'locked' | 'hidden';
    created_at: string;
    updated_at: string;
    deleted_at?: string;
    author?: { email: string }; // Joined data
    reply_count?: number;
};

export type Reply = {
    id: string;
    topic_id: string;
    author_id: string;
    body: string;
    created_at: string;
    updated_at: string;
    deleted_at?: string;
    author?: { email: string };
};

export async function getTopics(cityId: string, moduleId?: string) {
    let query = supabase
        .from('community_topics')
        .select('*, author:users(email), replies:community_replies(count)')
        .eq('city_id', cityId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

    if (moduleId) {
        query = query.eq('module_id', moduleId);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Format reply count
    return data.map(topic => ({
        ...topic,
        reply_count: topic.replies?.[0]?.count || 0
    })) as Topic[];
}

export async function getTopic(id: string) {
    const { data, error } = await supabase
        .from('community_topics')
        .select('*, author:users(email)')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data as Topic;
}

export async function createTopic(topic: Partial<Topic>) {
    const { data, error } = await supabase
        .from('community_topics')
        .insert(topic)
        .select()
        .single();

    if (error) throw error;
    return data as Topic;
}

export async function getReplies(topicId: string) {
    const { data, error } = await supabase
        .from('community_replies')
        .select('*, author:users(email)')
        .eq('topic_id', topicId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data as Reply[];
}

export async function createReply(reply: Partial<Reply>) {
    const { data, error } = await supabase
        .from('community_replies')
        .insert(reply)
        .select()
        .single();

    if (error) throw error;
    return data as Reply;
}

import { supabase } from './supabase';

export type AdminStats = {
    activeUsers: number;
    tasksCompleted: number;
    totalPoints: number;
    eventsCount: number;
    forumTopics: number;
};

export async function getAdminStats(): Promise<AdminStats> {
    // In a real app, these would be RPC calls or optimized queries.
    // For now, we'll do simple counts (careful with large datasets).

    const { count: activeUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null);

    const { count: tasksCompleted } = await supabase
        .from('user_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'done');

    const { data: pointsData } = await supabase
        .from('user_points')
        .select('points');
    const totalPoints = pointsData?.reduce((sum, p) => sum + p.points, 0) || 0;

    const { count: eventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

    const { count: forumTopics } = await supabase
        .from('community_topics')
        .select('*', { count: 'exact', head: true });

    return {
        activeUsers: activeUsers || 0,
        tasksCompleted: tasksCompleted || 0,
        totalPoints,
        eventsCount: eventsCount || 0,
        forumTopics: forumTopics || 0
    };
}

export async function getUsers(page = 1, perPage = 20) {
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const { data, error, count } = await supabase
        .from('users')
        .select('*', { count: 'exact' })
        .range(from, to)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return { users: data, total: count };
}

export async function updateUserRole(userId: string, role: 'user' | 'admin') {
    const { error } = await supabase
        .from('users')
        .update({ role })
        .eq('id', userId);

    if (error) throw error;
}

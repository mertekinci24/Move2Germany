import { supabase } from './supabase';

export type UserPoints = {
    id: string;
    user_id: string;
    event_id?: string;
    task_id?: string;
    action_type: 'TASK_COMPLETED' | 'EVENT_ATTENDED' | 'FORUM_POST';
    points: number;
    created_at: string;
};

export const POINTS_CONFIG = {
    TASK_COMPLETED: 10,
    EVENT_ATTENDED: 50,
    FORUM_POST: 5,
};

export async function awardPoints(userId: string, actionType: keyof typeof POINTS_CONFIG, referenceId?: string) {
    const points = POINTS_CONFIG[actionType];

    const { data, error } = await supabase
        .from('user_points')
        .insert({
            user_id: userId,
            action_type: actionType,
            points,
            task_id: actionType === 'TASK_COMPLETED' ? referenceId : undefined,
            event_id: actionType === 'EVENT_ATTENDED' ? referenceId : undefined,
        })
        .select()
        .single();

    if (error) throw error;
    return data as UserPoints;
}

export async function getUserTotalPoints(userId: string) {
    const { data, error } = await supabase
        .from('user_points')
        .select('points')
        .eq('user_id', userId);

    if (error) throw error;

    return data.reduce((sum, item) => sum + item.points, 0);
}

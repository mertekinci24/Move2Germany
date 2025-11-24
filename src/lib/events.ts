import { supabase } from './supabase';

export type Event = {
    id: string;
    city_id: string;
    title: string;
    description?: string;
    start_time: string;
    end_time?: string;
    venue_name?: string;
    address?: string;
    is_free: boolean;
    price_min?: number;
    price_max?: number;
    currency: string;
    source_type: 'official' | 'community' | 'platform';
    source_name?: string;
    source_url?: string;
    language: string;
    created_at: string;
    updated_at: string;
};

export async function getEvents(cityId: string) {
    const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('city_id', cityId)
        .gte('start_time', new Date().toISOString()) // Only future events
        .order('start_time', { ascending: true });

    if (error) throw error;
    return data as Event[];
}

// Stub for event ingestion (would be server-side in real app)
export async function importEvents(cityId: string) {
    console.log(`Importing events for ${cityId}...`);
    // TODO: Implement actual providers
    return [];
}

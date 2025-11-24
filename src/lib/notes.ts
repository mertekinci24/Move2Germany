import { supabase } from './supabase';

export type Note = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  related_task_id?: string;
  city_id?: string;
  module_id?: string;
  created_at: string;
  updated_at: string;
};

export async function getNotes(userId: string) {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data as Note[];
}

export async function createNote(note: Partial<Note>) {
  const { data, error } = await supabase
    .from('notes')
    .insert(note)
    .select()
    .single();

  if (error) throw error;
  return data as Note;
}

export async function updateNote(id: string, updates: Partial<Note>) {
  const { data, error } = await supabase
    .from('notes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Note;
}

export async function deleteNote(id: string) {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

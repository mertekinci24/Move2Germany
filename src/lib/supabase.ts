import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          locale: string;
          primary_city_id: string | null;
          arrival_date: string | null;
          persona_type: string | null;
          german_level: string | null;
          budget_range: string | null;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      user_tasks: {
        Row: {
          id: string;
          user_id: string;
          task_id: string;
          status: 'todo' | 'in_progress' | 'done' | 'blocked';
          notes: string | null;
          custom_due_date: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_tasks']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['user_tasks']['Insert']>;
      };
      documents: {
        Row: {
          id: string;
          user_id: string;
          task_id: string | null;
          storage_key: string;
          file_name: string;
          mime_type: string;
          size: number;
          uploaded_at: string;
        };
        Insert: Omit<Database['public']['Tables']['documents']['Row'], 'id' | 'uploaded_at'>;
        Update: Partial<Database['public']['Tables']['documents']['Insert']>;
      };
      ai_conversations: {
        Row: {
          id: string;
          user_id: string;
          started_at: string;
          ended_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['ai_conversations']['Row'], 'id' | 'started_at'>;
        Update: Partial<Database['public']['Tables']['ai_conversations']['Insert']>;
      };
      ai_messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: 'user' | 'assistant' | 'system';
          content: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['ai_messages']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['ai_messages']['Insert']>;
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          event_type: string;
          payload_json: any;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>;
      };
    };
  };
};

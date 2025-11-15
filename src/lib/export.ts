import { supabase } from './supabase';
import { getCurrentUser } from './auth';

export type UserDataExport = {
  exportDate: string;
  user: {
    id: string;
    email: string;
    locale: string;
    primaryCityId: string | null;
    arrivalDate: string | null;
    personaType: string | null;
    germanLevel: string | null;
    budgetRange: string | null;
    onboardingCompleted: boolean;
    createdAt: string;
  };
  tasks: Array<{
    taskId: string;
    status: string;
    notes: string | null;
    customDueDate: string | null;
    completedAt: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  documents: Array<{
    id: string;
    taskId: string | null;
    fileName: string;
    mimeType: string;
    size: number;
    uploadedAt: string;
  }>;
  aiConversations: Array<{
    id: string;
    startedAt: string;
    endedAt: string | null;
    messages: Array<{
      role: string;
      content: string;
      createdAt: string;
    }>;
  }>;
  auditLogs: Array<{
    eventType: string;
    timestamp: string;
  }>;
};

export async function exportUserData(): Promise<UserDataExport> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    throw new Error('User not authenticated');
  }

  const { data: userRecord } = await supabase
    .from('users')
    .select('*')
    .eq('id', currentUser.id)
    .maybeSingle();

  if (!userRecord) {
    throw new Error('User record not found');
  }

  const { data: tasks } = await supabase
    .from('user_tasks')
    .select('*')
    .eq('user_id', currentUser.id);

  const { data: documents } = await supabase
    .from('documents')
    .select('id, task_id, file_name, mime_type, size, uploaded_at')
    .eq('user_id', currentUser.id);

  const { data: conversations } = await supabase
    .from('ai_conversations')
    .select('id, started_at, ended_at')
    .eq('user_id', currentUser.id);

  const aiConversationsWithMessages = [];

  if (conversations && conversations.length > 0) {
    for (const conv of conversations) {
      const { data: messages } = await supabase
        .from('ai_messages')
        .select('role, content, created_at')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: true });

      aiConversationsWithMessages.push({
        id: conv.id,
        startedAt: conv.started_at,
        endedAt: conv.ended_at,
        messages: messages?.map(m => ({
          role: m.role,
          content: m.content,
          createdAt: m.created_at
        })) || []
      });
    }
  }

  const { data: auditLogs } = await supabase
    .from('audit_logs')
    .select('event_type, created_at')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false });

  const exportData: UserDataExport = {
    exportDate: new Date().toISOString(),
    user: {
      id: userRecord.id,
      email: userRecord.email,
      locale: userRecord.locale,
      primaryCityId: userRecord.primary_city_id,
      arrivalDate: userRecord.arrival_date,
      personaType: userRecord.persona_type,
      germanLevel: userRecord.german_level,
      budgetRange: userRecord.budget_range,
      onboardingCompleted: userRecord.onboarding_completed,
      createdAt: userRecord.created_at
    },
    tasks: tasks?.map(t => ({
      taskId: t.task_id,
      status: t.status,
      notes: t.notes,
      customDueDate: t.custom_due_date,
      completedAt: t.completed_at,
      createdAt: t.created_at,
      updatedAt: t.updated_at
    })) || [],
    documents: documents?.map(d => ({
      id: d.id,
      taskId: d.task_id,
      fileName: d.file_name,
      mimeType: d.mime_type,
      size: d.size,
      uploadedAt: d.uploaded_at
    })) || [],
    aiConversations: aiConversationsWithMessages,
    auditLogs: auditLogs?.map(log => ({
      eventType: log.event_type,
      timestamp: log.created_at
    })) || []
  };

  return exportData;
}

export function downloadUserDataAsJSON(data: UserDataExport, filename?: string) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `move2germany-data-export-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

import { supabase } from './supabase';

export type UserProfile = {
  id: string;
  email: string;
  locale: string;
  primaryCityId: string | null;
  arrivalDate: string | null;
  personaType: string | null;
  germanLevel: string | null;
  budgetRange: string | null;
  onboardingCompleted: boolean;
  needsPasswordReset?: boolean;
};

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        locale: 'en',
      }
    }
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error('Failed to create user');
  }

  await logAuditEvent(data.user.id, 'USER_SIGNUP', { email });

  return data.user;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error('Invalid credentials');
  }

  await logAuditEvent(data.user.id, 'USER_LOGIN', { email });

  const profile = await getCurrentUser();
  return profile;
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .is('deleted_at', null)
    .maybeSingle();

  if (profileError || !profile) {
    return {
      id: user.id,
      email: user.email || '',
      locale: 'en',
      primaryCityId: null,
      arrivalDate: null,
      personaType: null,
      germanLevel: null,
      budgetRange: null,
      onboardingCompleted: false,
    };
  }

  return mapUserToProfile(profile);
}

export async function updateProfile(userId: string, updates: Partial<UserProfile>) {
  const dbUpdates: Record<string, unknown> = {};

  if (updates.locale !== undefined) dbUpdates.locale = updates.locale;
  if (updates.primaryCityId !== undefined) dbUpdates.primary_city_id = updates.primaryCityId;
  if (updates.arrivalDate !== undefined) dbUpdates.arrival_date = updates.arrivalDate;
  if (updates.personaType !== undefined) dbUpdates.persona_type = updates.personaType;
  if (updates.germanLevel !== undefined) dbUpdates.german_level = updates.germanLevel;
  if (updates.budgetRange !== undefined) dbUpdates.budget_range = updates.budgetRange;
  if (updates.onboardingCompleted !== undefined) dbUpdates.onboarding_completed = updates.onboardingCompleted;

  const { data, error } = await supabase
    .from('users')
    .update(dbUpdates)
    .eq('id', userId)
    .select()
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return mapUserToProfile(data);
}

export async function changePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    await supabase
      .from('users')
      .update({ needs_password_reset: false })
      .eq('id', user.id);
  }
}

export async function deleteAccount(userId: string) {
  await logAuditEvent(userId, 'USER_ACCOUNT_DELETED', {
    timestamp: new Date().toISOString()
  });

  const { error: tasksError } = await supabase
    .from('user_tasks')
    .delete()
    .eq('user_id', userId);

  if (tasksError) {
    throw new Error(`Failed to delete user tasks: ${tasksError.message}`);
  }

  const { data: documents } = await supabase
    .from('documents')
    .select('storage_key')
    .eq('user_id', userId);

  if (documents && documents.length > 0) {
    for (const doc of documents) {
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([doc.storage_key]);

      if (storageError) {
        console.error('Failed to delete document from storage:', storageError);
      }
    }
  }

  const { error: documentsError } = await supabase
    .from('documents')
    .delete()
    .eq('user_id', userId);

  if (documentsError) {
    throw new Error(`Failed to delete documents: ${documentsError.message}`);
  }

  const { data: conversations } = await supabase
    .from('ai_conversations')
    .select('id')
    .eq('user_id', userId);

  if (conversations && conversations.length > 0) {
    const conversationIds = conversations.map(c => c.id);

    const { error: messagesError } = await supabase
      .from('ai_messages')
      .delete()
      .in('conversation_id', conversationIds);

    if (messagesError) {
      throw new Error(`Failed to delete AI messages: ${messagesError.message}`);
    }
  }

  const { error: conversationsError } = await supabase
    .from('ai_conversations')
    .delete()
    .eq('user_id', userId);

  if (conversationsError) {
    throw new Error(`Failed to delete AI conversations: ${conversationsError.message}`);
  }

  const { error: auditError } = await supabase
    .from('audit_logs')
    .update({ user_id: null })
    .eq('user_id', userId);

  if (auditError) {
    console.error('Failed to anonymize audit logs:', auditError);
  }

  const { error: userError } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  if (userError) {
    throw new Error(`Failed to delete user: ${userError.message}`);
  }

  await signOut();
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}

function mapUserToProfile(user: Record<string, unknown>): UserProfile {
  return {
    id: user.id as string,
    email: user.email as string,
    locale: (user.locale as string) || 'en',
    primaryCityId: user.primary_city_id as string | null,
    arrivalDate: user.arrival_date as string | null,
    personaType: user.persona_type as string | null,
    germanLevel: user.german_level as string | null,
    budgetRange: user.budget_range as string | null,
    onboardingCompleted: (user.onboarding_completed as boolean) || false,
    needsPasswordReset: (user.needs_password_reset as boolean) || false,
  };
}

export async function logAuditEvent(userId: string | null, eventType: string, payload: Record<string, unknown>) {
  await supabase
    .from('audit_logs')
    .insert({
      user_id: userId,
      event_type: eventType,
      payload_json: payload
    });
}

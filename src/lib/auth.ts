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

  await logAuditEvent(data.user.id, 'signup', { email });

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

  await logAuditEvent(data.user.id, 'login', { email });

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
  const timestamp = new Date().toISOString();

  // Soft delete user
  const { error } = await supabase
    .from('users')
    .update({ deleted_at: timestamp })
    .eq('id', userId);

  if (error) throw new Error(error.message);

  // Soft delete community content
  await supabase.from('community_topics').update({ deleted_at: timestamp }).eq('author_id', userId);
  await supabase.from('community_replies').update({ deleted_at: timestamp }).eq('author_id', userId);

  // Hard delete private data (optional, but good for GDPR)
  // await supabase.from('notes').delete().eq('user_id', userId);

  await signOut();
}

export async function exportUserData(userId: string) {
  const tables = [
    'users', 'user_tasks', 'documents', 'ai_conversations',
    'notes', 'user_points', 'community_topics', 'community_replies'
  ];

  const exportData: Record<string, any> = {};

  for (const table of tables) {
    const { data } = await supabase
      .from(table)
      .select('*')
      .eq(table === 'community_topics' || table === 'community_replies' ? 'author_id' : 'user_id', userId);

    exportData[table] = data || [];
  }

  return exportData;
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

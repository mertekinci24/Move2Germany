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
};

export async function signUp(email: string, password: string) {
  const passwordHash = await hashPassword(password);

  const { data, error } = await supabase
    .from('users')
    .insert({
      email,
      password_hash: passwordHash,
      locale: 'en',
      onboarding_completed: false
    })
    .select()
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function signIn(email: string, password: string) {
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .is('deleted_at', null)
    .maybeSingle();

  if (error || !user) {
    throw new Error('Invalid credentials');
  }

  const isValid = await verifyPassword(password, user.password_hash);

  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  await logAuditEvent(user.id, 'login', { email });

  return mapUserToProfile(user);
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  const userId = sessionStorage.getItem('userId');

  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapUserToProfile(data);
}

export async function updateProfile(userId: string, updates: Partial<UserProfile>) {
  const dbUpdates: any = {};

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

export async function changePassword(userId: string, oldPassword: string, newPassword: string) {
  const { data: user, error } = await supabase
    .from('users')
    .select('password_hash')
    .eq('id', userId)
    .maybeSingle();

  if (error || !user) {
    throw new Error('User not found');
  }

  const isValid = await verifyPassword(oldPassword, user.password_hash);

  if (!isValid) {
    throw new Error('Invalid current password');
  }

  const newHash = await hashPassword(newPassword);

  const { error: updateError } = await supabase
    .from('users')
    .update({ password_hash: newHash })
    .eq('id', userId);

  if (updateError) {
    throw new Error(updateError.message);
  }
}

export async function deleteAccount(userId: string) {
  const { error } = await supabase
    .from('users')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    throw new Error(error.message);
  }

  signOut();
}

export function signOut() {
  sessionStorage.removeItem('userId');
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

function mapUserToProfile(user: any): UserProfile {
  return {
    id: user.id,
    email: user.email,
    locale: user.locale,
    primaryCityId: user.primary_city_id,
    arrivalDate: user.arrival_date,
    personaType: user.persona_type,
    germanLevel: user.german_level,
    budgetRange: user.budget_range,
    onboardingCompleted: user.onboarding_completed
  };
}

export async function logAuditEvent(userId: string | null, eventType: string, payload: any) {
  await supabase
    .from('audit_logs')
    .insert({
      user_id: userId,
      event_type: eventType,
      payload_json: payload
    });
}

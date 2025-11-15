import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, getCurrentUser, signIn as authSignIn, signUp as authSignUp, signOut as authSignOut } from '../lib/auth';
import { supabase } from '../lib/supabase';

type AuthContextType = {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        (async () => {
          if (event === 'SIGNED_IN' && session) {
            const profile = await getCurrentUser();
            setUser(profile);
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
          } else if (event === 'USER_UPDATED') {
            const profile = await getCurrentUser();
            setUser(profile);
          }
        })();
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  async function checkUser() {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Failed to get current user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    const profile = await authSignIn(email, password);
    setUser(profile);
  }

  async function signUp(email: string, password: string) {
    await authSignUp(email, password);
    const profile = await getCurrentUser();
    setUser(profile);
  }

  async function signOut() {
    await authSignOut();
    setUser(null);
  }

  async function refreshUser() {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

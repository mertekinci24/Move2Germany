import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, getCurrentUser, signIn as authSignIn, signUp as authSignUp, signOut as authSignOut } from '../lib/auth';

type AuthContextType = {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
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
    sessionStorage.setItem('userId', profile.id);
    setUser(profile);
  }

  async function signUp(email: string, password: string) {
    const newUser = await authSignUp(email, password);
    sessionStorage.setItem('userId', newUser.id);
    const profile = await getCurrentUser();
    setUser(profile);
  }

  function signOut() {
    authSignOut();
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

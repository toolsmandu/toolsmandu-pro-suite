import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type UserRole = 'admin' | 'editor' | 'customer';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: UserRole[];
  isAdmin: boolean;
  isEditor: boolean;
  profile: { name: string | null; email: string | null; phone: string | null; avatar_url: string | null } | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  roles: [],
  isAdmin: false,
  isEditor: false,
  profile: null,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [profile, setProfile] = useState<AuthContextType['profile']>(null);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRoles([]);
    setProfile(null);
  }, []);

  const fetchUserData = useCallback(async (userId: string) => {
    const [rolesRes, profileRes] = await Promise.all([
      supabase.from('user_roles').select('role').eq('user_id', userId),
      supabase.from('profiles').select('name, email, phone, avatar_url, is_suspended').eq('user_id', userId).single(),
    ]);

    // Check suspension
    if (profileRes.data?.is_suspended) {
      toast.error('Your account is suspended. Please contact Support team.');
      await signOut();
      return;
    }

    setRoles((rolesRes.data ?? []).map((roleRecord) => roleRecord.role as UserRole));
    setProfile(profileRes.data ? { name: profileRes.data.name, email: profileRes.data.email, phone: profileRes.data.phone, avatar_url: profileRes.data.avatar_url } : null);
  }, [signOut]);

  const syncAuthState = useCallback(async (nextSession: Session | null, isInitial = false) => {
    if (isInitial) setLoading(true);
    setSession(nextSession);
    setUser(nextSession?.user ?? null);

    if (nextSession?.user) {
      await fetchUserData(nextSession.user.id);
    } else {
      setRoles([]);
      setProfile(null);
    }

    if (isInitial) setLoading(false);
  }, [fetchUserData]);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchUserData(user.id);
  }, [user, fetchUserData]);

  // Listen for realtime suspension changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`profile-suspension-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new && (payload.new as any).is_suspended) {
            toast.error('Your account has been suspended. Please contact Support team.');
            signOut();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, signOut]);

  useEffect(() => {
    let initialized = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (initialized) {
        syncAuthState(nextSession, false);
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      await syncAuthState(session, true);
      initialized = true;
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{
      user, session, loading, roles, profile,
      isAdmin: roles.includes('admin'),
      isEditor: roles.includes('editor'),
      signOut, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface Profile {
  id: string;
  display_name: string;
  email: string;
  avatar_url?: string;
  role: 'listener' | 'artist' | 'admin';
}

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const getProfile = useCallback(async (user: User) => {
    try {
      const { data, error, status } = await supabase
        .from('profiles')
        .select(`*`)
        .eq('id', user.id)
        .single();

      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setProfile(data as Profile);
      }
    } catch (error: any) {
      console.error("Profile fetch error:", error);
      toast.error('Failed to fetch profile.', { description: "Please ensure your profile exists and RLS policies are correct." });
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    setLoading(true);

    const initializeSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        if (currentSession?.user) {
          await getProfile(currentSession.user);
        }
      } catch (e) {
        console.error("Error initializing session:", e);
        toast.error("Could not initialize session", { description: "There was an issue connecting to the authentication service." });
      } finally {
        // This will be set to false by the timeout or the auth state change
      }
    };

    initializeSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      const currentUser = newSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await getProfile(currentUser);
      } else {
        setProfile(null);
      }
      // Once the auth state is confirmed, stop loading.
      setLoading(false);
    });

    // Failsafe timeout
    const timer = setTimeout(() => {
      if (loading) {
        console.warn("Auth check timed out after 60 seconds. Forcing UI unlock.");
        setLoading(false);
      }
    }, 60000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [getProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = useCallback(async () => {
    if (user) {
      await getProfile(user);
    }
  }, [user, getProfile]);

  const value = {
    session,
    user,
    profile,
    loading,
    signOut,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

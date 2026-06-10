import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export type UserRole = 'admin';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  login: () => Promise<void>;
  loginWithEmail: (email: string, passcode: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let subscription: any = null;

    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Error fetching session", error);
        }
        
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          checkAdmin(currentUser.id);
        } else {
          setIsAdmin(false);
          setLoading(false);
        }
      } catch (err) {
        console.error("Supabase getSession failed. Check configuration.", err);
        setLoading(false);
      }
    };

    getSession();

    try {
      const { data } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          
          if (currentUser) {
            checkAdmin(currentUser.id);
          } else {
            setIsAdmin(false);
            setLoading(false);
          }
        }
      );
      subscription = data.subscription;
    } catch (err) {
      console.error("Failed to set up auth state change listener.", err);
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const checkAdmin = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('roles')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error("Error fetching user profile", error);
        setIsAdmin(false);
      } else if (data && data.roles && Array.isArray(data.roles)) {
        setIsAdmin(data.roles.includes('admin'));
      }
    } catch (e) {
      console.error("Failed to fetch admin status", e);
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string, passcode: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: passcode,
    });
    return { error };
  };

  const login = async () => {
    // Redirect to admin login page instead of using OAuth
    window.location.href = '/admin/login';
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, login, loginWithEmail, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

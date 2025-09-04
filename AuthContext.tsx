import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { TeamMember } from './lib/types';

interface AuthContextType {
  user: User | null;
  userProfile: TeamMember | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const initializeAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          if (isMounted) {
            setUser(null);
            setUserProfile(null);
          }
        } else {
          setUser(user);
          await fetchUserProfile(user.id);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      if (event === 'SIGNED_OUT' || !session?.user) {
        setUser(null);
        setUserProfile(null);
      } else {
        setUser(session.user);
        await fetchUserProfile(session.user.id);
      }
      
      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      // Look for a team member record linked to the user's ID or email
      const { data: teamMember, error } = await supabase
        .from('team')
        .select(`
          id, "Engineer ID", "Name", "Email", "Phone Number", "Role", "Skills", user_id
        `)
        .or(`user_id.eq.${userId},Email.eq.${user?.email}`)
        .maybeSingle();

      if (error) throw error;
      
      if (teamMember) {
        // If a match is found, ensure it's linked by user_id
        if (teamMember.user_id !== userId) {
          await supabase
            .from('team')
            .update({ user_id: userId })
            .eq('id', teamMember.id);
        }
        setUserProfile({ ...teamMember, teamId: teamMember.id });
      } else {
        // No team member found, create a minimal profile
        setUserProfile({
          id: '',
          "Engineer ID": 'N/A',
          "Name": user?.email?.split('@')[0] || 'Guest',
          "Email": user?.email || '',
          "Role": "Viewer",
          "Skills": []
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUserProfile(null);
    }
  };

  const signIn = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const signUp = async (email: string, password: string) => {
    return await supabase.auth.signUp({ email, password });
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  userProfile: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const initializeAuth = async () => {
      try {
        
        // Set a fallback timeout to ensure loading never stays true indefinitely
        const fallbackTimeout = setTimeout(() => {
          if (isMounted) {
            setLoading(false);
          }
        }, 3000); // 3 second timeout

        // Get current session
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          // Clear any stale session data
          await supabase.auth.signOut();
          if (isMounted) {
            setUser(null);
            setUserProfile(null);
            setLoading(false);
            clearTimeout(fallbackTimeout);
          }
          return;
        }

        if (!isMounted) return;

        setUser(user ?? null);

        // Fetch user profile with timeout protection
        if (user) {
          try {
            await Promise.race([
              fetchUserProfile(user.id),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Profile fetch timeout')), 2000)
              )
            ]);
          } catch (error) {
            // Continue without profile - user can still use the app
          }
        }

        if (isMounted) {
          setLoading(false);
          clearTimeout(fallbackTimeout);
        }
        
      } catch (error) {
        if (isMounted) {
          setUser(null);
          setUserProfile(null);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      // Handle signed out or invalid session
      if (event === 'SIGNED_OUT' || !session?.user) {
        await supabase.auth.signOut();
        setUser(null);
        setUserProfile(null);
        if (isMounted) {
          setLoading(false);
        }
        return;
      }
      
      setUser(session?.user ?? null);
      
      if (session?.user) {
        try {
          await Promise.race([
            fetchUserProfile(session.user.id),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Profile fetch timeout')), 2000)
            )
          ]);
        } catch (error) {
        }
      } else {
        setUserProfile(null);
      }
      
      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      // First try to find by user_id
      const { data, error } = await supabase
        .from('team')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No user_id match found, try to find by email
          const { data: userData } = await supabase.auth.getUser();
          if (userData.user?.email) {
            const { data: teamByEmail } = await supabase
              .from('team')
              .select('*')
              .eq('"Email"', userData.user.email)
              .maybeSingle();
            
            if (teamByEmail) {
              // Update the team record to link it to this user_id
              await supabase
                .from('team')
                .update({ user_id: userId })
                .eq('id', teamByEmail.id);
              
              setUserProfile({
                ...teamByEmail,
                teamId: teamByEmail.id // Add teamId for task filtering
              });
            } else {
              // Create a minimal profile for users not in team table
              setUserProfile({
               id: null, // Set to null to indicate no linked team profile
                "Name": userData.user.email.split('@')[0],
                "Email": userData.user.email,
                "Role": "Engineer",
                "Skills": []
              });
            }
          }
        } else {
          setUserProfile(null);
        }
      } else {
        if (data) {
          setUserProfile({
            ...data,
            teamId: data.id // Add teamId for task filtering
          });
        } else {
          const { data: userData } = await supabase.auth.getUser();
          if (userData.user?.email) {
            // Try to find by email as fallback
            const { data: teamByEmail } = await supabase
              .from('team')
              .select('*')
              .eq('"Email"', userData.user.email)
              .maybeSingle();
            
            if (teamByEmail) {
              // Link the team member to this user
              await supabase
                .from('team')
                .update({ user_id: userId })
                .eq('id', teamByEmail.id);
              
              setUserProfile({
                ...teamByEmail,
                teamId: teamByEmail.id
              });
            } else {
              // Create temporary profile
              setUserProfile({
               id: null, // Set to null to indicate no linked team profile
                "Name": userData.user.email.split('@')[0],
                "Email": userData.user.email,
                "Role": "Engineer",
                "Skills": []
              });
            }
          }
        }
      }
    } catch (error) {
      setUserProfile(null);
      throw error; // Re-throw to allow timeout handling
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
      // Ignore errors during signout - we still want to clear local state
    } finally {
      // Explicitly clear all Supabase auth data from local storage
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('sb-' + import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0] + '-auth-token');
      
      // Clear any other potential Supabase storage keys
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') && key.includes('auth-token')) {
          localStorage.removeItem(key);
        }
      });
      
      // Immediately reset state
      setUser(null);
      setUserProfile(null);
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
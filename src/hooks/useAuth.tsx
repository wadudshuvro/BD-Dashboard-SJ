import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

type UserRole = 'super_admin' | 'manager' | 'bd_user' | 'brand_manager' | 'pm' | 'user';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  brandAccess?: string[];
}

interface AuthContextType {
  user: User | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => void;
  loading: boolean;
  hasRole: (role: UserRole) => boolean;
  hasMinimumRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Role hierarchy for permission checking
  const roleHierarchy: Record<UserRole, number> = {
    'user': 1,
    'bd_user': 2,
    'pm': 3,
    'brand_manager': 4,
    'manager': 5,
    'super_admin': 6
  };

  // Fetch user profile from profiles table and role from user_roles table
  const fetchUserProfile = async (authUser: SupabaseUser): Promise<User | null> => {
    try {
      // Fetch user profile data from profiles table
      const { data: userProfile, error: userError } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url')
        .eq('id', authUser.id)
        .maybeSingle();

      if (userError) {
        console.error('Error fetching user profile:', userError);
        return null;
      }

      if (!userProfile) {
        console.warn('No user profile found for authenticated user');
        return null;
      }

      // Fetch role from user_roles table (secure separate table)
      // Order by role hierarchy to get highest priority role in case of duplicates
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles' as any)
        .select('role')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (roleError) {
        console.error('Error fetching user role:', roleError);
      }

      // Parse full_name to get first and last names
      const nameParts = (userProfile.full_name || '').trim().split(' ');
      const displayName = userProfile.full_name || userProfile.email;

      return {
        id: userProfile.id,
        name: displayName,
        email: userProfile.email,
        role: ((roleData as any)?.role || 'user') as UserRole,
        avatar: userProfile.avatar_url || authUser.user_metadata?.avatar_url
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;
    
    // Set up auth state listener (sync callback only)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      setSession(session);

      if (session?.user) {
        // Defer Supabase calls to avoid deadlocks
        setTimeout(() => {
          fetchUserProfile(session.user).then((profile) => {
            if (!mounted) return;
            
            if (profile) {
              setUser(profile);
            } else {
              console.warn('No user profile found for authenticated user');
              setUser(null);
            }
            setLoading(false);
            setIsInitialized(true);
          });
        }, 0);
      } else {
        setUser(null);
        setLoading(false);
        setIsInitialized(true);
      }
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      setSession(session);

      if (session?.user) {
        fetchUserProfile(session.user).then((profile) => {
          if (!mounted) return;
          
          if (profile) {
            setUser(profile);
          } else {
            console.warn('No user profile found for authenticated user');
            setUser(null);
          }
          setLoading(false);
          setIsInitialized(true);
        });
      } else {
        setLoading(false);
        setIsInitialized(true);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    setLoading(true);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      setLoading(false);
      throw new Error(error.message);
    }

    // User profile will be fetched automatically by the auth state change listener
    setLoading(false);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  const hasMinimumRole = (role: UserRole): boolean => {
    if (!user) return false;
    return roleHierarchy[user.role] >= roleHierarchy[role];
  };

  // Don't render children until the provider is initialized
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      loading,
      hasRole,
      hasMinimumRole
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
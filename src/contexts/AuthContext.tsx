import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserRole } from '../types/database';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface OrganizationMember {
  id: string;
  organization_id: string;
  role: UserRole;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  organizations: OrganizationMember[];
  currentOrganization: OrganizationMember | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  setCurrentOrganization: (org: OrganizationMember) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [organizations, setOrganizations] = useState<OrganizationMember[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<OrganizationMember | null>(null);
  const [loading, setLoading] = useState(true);
  const defaultOrganizationId =
    import.meta.env.VITE_DEFAULT_ORGANIZATION_ID || '11111111-1111-1111-1111-111111111111';

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      (async () => {
        try {
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            await loadUserData(session.user.id);
          }
        } catch (error) {
          console.error('Error initializing auth session:', error);
        } finally {
          setLoading(false);
        }
      })();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        try {
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            await loadUserData(session.user.id);
          } else {
            setProfile(null);
            setOrganizations([]);
            setCurrentOrganization(null);
          }
        } catch (error) {
          console.error('Error handling auth state change:', error);
        } finally {
          setLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error loading user profile:', profileError);
      }

      if (profileData) {
        setProfile(profileData);
      }

      const { data: orgsData, error: orgsError } = await supabase
        .from('organization_members')
        .select(`
          id,
          organization_id,
          role,
          organizations (
            id,
            name,
            slug
          )
        `)
        .eq('user_id', userId);

      if (orgsError) {
        console.error('Error loading organization memberships:', orgsError);
      }

      if (orgsData) {
        const formattedOrgs = orgsData.map((om) => ({
          id: om.id,
          organization_id: om.organization_id,
          role: om.role,
          organization: Array.isArray(om.organizations)
            ? om.organizations[0]
            : om.organizations,
        })) as OrganizationMember[];

        const rolePriority: Record<UserRole, number> = {
          super_admin: 4,
          admin: 3,
          instructor: 2,
          learner: 1,
        };

        const sortedOrgs = [...formattedOrgs].sort(
          (a, b) => rolePriority[b.role] - rolePriority[a.role]
        );

        setOrganizations(sortedOrgs);
        if (sortedOrgs.length > 0 && !currentOrganization) {
          setCurrentOrganization(sortedOrgs[0]);
        }
      }
    } catch (error) {
      console.error('Unexpected error loading user data:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, fullName: string, role: UserRole) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          organization_id: defaultOrganizationId,
        },
      },
    });
    if (error) throw error;

    if (data.user && data.session) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ full_name: fullName })
        .eq('id', data.user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
      }
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
    setOrganizations([]);
    setCurrentOrganization(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        organizations,
        currentOrganization,
        loading,
        signIn,
        signUp,
        signOut,
        setCurrentOrganization,
      }}
    >
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

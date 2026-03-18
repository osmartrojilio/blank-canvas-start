import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  organization_id: string | null;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  is_owner: boolean;
  is_email_verified: boolean;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  plan_id: string | null;
  subscription_status: string;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
}

interface UserRole {
  role: "admin" | "manager" | "driver";
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  organization: Organization | null;
  userRole: UserRole | null;
  loading: boolean;
  isAdmin: boolean;
  needsOnboarding: boolean;
  isSubscriptionBlocked: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, organizationName: string, cnpj?: string, whatsapp?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const fetchUserData = async (userId: string): Promise<boolean> => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);

        // Check if user needs to complete onboarding (has no organization)
        if (!profileData.organization_id) {
          setNeedsOnboarding(true);
          return true; // needs onboarding
        }

        setNeedsOnboarding(false);

        // Fetch organization if user has one
        const { data: orgData } = await supabase
          .from("organizations")
          .select("*")
          .eq("id", profileData.organization_id)
          .maybeSingle();
        
        if (orgData) {
          setOrganization(orgData);
        }

        // Fetch user role
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("organization_id", profileData.organization_id)
          .maybeSingle();
        
        if (roleData) {
          setUserRole(roleData as UserRole);
        }
      } else {
        // No profile yet - needs onboarding
        setNeedsOnboarding(true);
        return true;
      }
      return false;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error fetching user data:", error);
      }
      return false;
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Listener for ongoing auth changes (does NOT control loading)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);

        // Fire and forget - don't wait, don't set loading
        if (session?.user) {
          fetchUserData(session.user.id);
        } else {
          setProfile(null);
          setOrganization(null);
          setUserRole(null);
          setNeedsOnboarding(false);
        }
      }
    );

    // INITIAL load (controls loading state)
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        // Fetch user data BEFORE setting loading to false
        if (session?.user) {
          await fetchUserData(session.user.id);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string, organizationName: string, cnpj?: string, whatsapp?: string) => {
    try {
      // Create user account with metadata - the database trigger will atomically
      // create the organization, profile, and admin role in a single transaction
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
            organization_name: organizationName,
            cnpj: cnpj || null,
            whatsapp: whatsapp || null,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Erro ao criar usuário");

      return { error: null };
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Signup error:", error);
      }
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setOrganization(null);
    setUserRole(null);
  };

  const isAdmin = userRole?.role === "admin";

  // Legacy: keep isSubscriptionBlocked as false — hybrid model never blocks access
  const isSubscriptionBlocked = false;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        organization,
        userRole,
        loading,
        isAdmin,
        isSubscriptionBlocked,
        needsOnboarding,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

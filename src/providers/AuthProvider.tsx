import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import type { Profile, UserRole } from "@/lib/domain";
import {
  getCurrentProfile,
  getSession,
  signIn,
  signOut,
  signUp,
  updateProfile,
} from "@/lib/supabase/services/auth";

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    fullName: string;
    email: string;
    password: string;
    role: UserRole;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  saveProfile: (input: { fullName: string; age: number | null; phone: string | null }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = async () => {
    const nextProfile = await getCurrentProfile();
    setProfile(nextProfile);
  };

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        const activeSession = await getSession();
        if (!mounted) {
          return;
        }

        setSession(activeSession);
        if (activeSession) {
          const activeProfile = await getCurrentProfile();
          if (mounted) {
            setProfile(activeProfile);
          }
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void bootstrap();

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setProfile(null);
        setIsLoading(false);
        return;
      }

      void getCurrentProfile()
        .then((nextProfile) => {
          if (mounted) {
            setProfile(nextProfile);
          }
        })
        .finally(() => {
          if (mounted) {
            setIsLoading(false);
          }
        });
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      isAuthenticated: Boolean(session && profile),
      isLoading,
      login: async (email, password) => {
        await signIn(email, password);
        await refreshProfile();
      },
      register: async ({ fullName, email, password, role }) => {
        await signUp({ fullName, email, password, role });
        await refreshProfile();
      },
      logout: async () => {
        await signOut();
        setSession(null);
        setProfile(null);
      },
      refreshProfile,
      saveProfile: async (input) => {
        await updateProfile(input);
        await refreshProfile();
      },
    }),
    [session, profile, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

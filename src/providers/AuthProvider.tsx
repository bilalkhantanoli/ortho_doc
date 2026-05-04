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
import { queryClient } from "@/lib/queryClient";
import {
  getCurrentProfile,
  getSession,
  signIn,
  signOut,
  signUp,
  sendPasswordResetEmail,
  updatePassword,
  updateProfile,
} from "@/lib/supabase/services/auth";

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<Profile | null>;
  register: (input: {
    fullName: string;
    email: string;
    password: string;
    role: UserRole;
  }) => Promise<Profile | null>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  saveProfile: (input: { fullName: string; age: number | null; phone: string | null }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const passwordResetRedirect =
    typeof window === "undefined" ? "" : `${window.location.origin}/auth/reset-password`;

  const waitForProfile = async () => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const nextProfile = await getCurrentProfile();
      if (nextProfile) {
        return nextProfile;
      }

      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    setProfile(null);
    return null;
  };

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
          const activeProfile = await waitForProfile();
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
        .then(async (nextProfile) => {
          if (mounted) {
            setProfile(nextProfile ?? (await waitForProfile()));
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
        setIsLoading(true);
        try {
          await signIn(email, password);
          const nextSession = await getSession();
          setSession(nextSession);
          const nextProfile = await waitForProfile();
          if (!nextProfile) {
            throw new Error("Unable to load your profile. Please try again.");
          }
          setProfile(nextProfile);
          return nextProfile;
        } finally {
          setIsLoading(false);
        }
      },
      register: async ({ fullName, email, password, role }) => {
        setIsLoading(true);
        try {
          const sessionResult = await signUp({ fullName, email, password, role });
          setSession(sessionResult);

          if (!sessionResult) {
            setProfile(null);
            return null;
          }

          const nextProfile = await waitForProfile();
          if (!nextProfile) {
            throw new Error("Unable to load your profile. Please try again.");
          }
          setProfile(nextProfile);
          return nextProfile;
        } finally {
          setIsLoading(false);
        }
      },
      requestPasswordReset: async (email) => {
        await sendPasswordResetEmail(email, passwordResetRedirect);
      },
      resetPassword: async (password) => {
        await updatePassword(password);
      },
      logout: async () => {
        await signOut();
        setSession(null);
        setProfile(null);
        queryClient.clear();
      },
      refreshProfile,
      saveProfile: async (input) => {
        await updateProfile(input);
        await refreshProfile();
      },
    }),
    [session, profile, isLoading, passwordResetRedirect],
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

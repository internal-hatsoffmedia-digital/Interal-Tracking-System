import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type {
  Session,
  User,
} from "@supabase/supabase-js";

import { supabase } from "../lib/supabase";

import {
  getCurrentProfile,
  signOut as authSignOut,
} from "../services/auth/auth.service";

import type { Profile } from "../types/auth";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext =
  createContext<AuthContextValue | undefined>(
    undefined,
  );

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [session, setSession] =
    useState<Session | null>(null);

  const [user, setUser] =
    useState<User | null>(null);

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    try {
      const currentProfile =
        await getCurrentProfile();

      setProfile(currentProfile);
    } catch (error) {
      console.error(
        "Failed to load profile:",
        error,
      );

      setProfile(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (!mounted) {
          return;
        }

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          await loadProfile();
        }
      } catch (error) {
        console.error(
          "Failed to initialize authentication:",
          error,
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!mounted) {
          return;
        }

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          await loadProfile();
        } else {
          setProfile(null);
        }

        setLoading(false);
      },
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await authSignOut();

    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    await loadProfile();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider",
    );
  }

  return context;
}